# Two-Factor Authentication (TOTP)

## What it is

Optional, per-user two-factor authentication using **TOTP** (Time-based
One-Time Password, [RFC 6238](https://www.rfc-editor.org/rfc/rfc6238)). Once a
user enables it, logging in requires their password **and** a 6-digit code
from an authenticator app (Google Authenticator, Authy, 1Password, etc.), or a
one-time backup/recovery code as a fallback if they lose their device.

## Stack / libraries

| Layer | Library | Purpose |
|---|---|---|
| BE (user-service) | [`otpauth`](https://www.npmjs.com/package/otpauth) | Generates the TOTP secret, builds the `otpauth://` URL, validates submitted codes (`window: 1` → accepts ±30s clock drift) |
| BFF (web) | [`qrcode`](https://www.npmjs.com/package/qrcode) | Renders the `otpauth://` URL as a QR image **locally** (`QRCode.toDataURL(...)`), so the secret is never sent to a third-party QR-generation API |
| BE (user-service) | existing `passwordHasher` (scrypt, `services/user/server/utils/password.ts`) | Reused to hash recovery codes the same way passwords are hashed — never stored in plaintext |

## Data model

Two additions to `db/schema.sql` / `services/user/server/utils/schema.ts`:

```sql
-- users table (existing table, 2 new columns)
totp_secret  TEXT NULL,              -- base32 secret, set once on setup, cleared on disable
totp_enabled BOOLEAN NOT NULL DEFAULT FALSE

-- new table: one row per issued recovery/backup code
CREATE TABLE totp_recovery_codes (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash  TEXT NOT NULL,          -- scrypt hash, never plaintext
  used_at    TIMESTAMPTZ NULL,       -- set on consumption; kept (not deleted) for an audit trail
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

8 recovery codes are generated per `enable` call, format `XXXXX-XXXXX` (10 hex
chars). Each is single-use, enforced by checking `used_at IS NULL` and setting
it on consumption.

## How it works (flow)

### Enabling 2FA (from the profile page)

1. **Setup** — BE generates an `otpauth.Secret`, stores it unconfirmed on the
   user row (`totp_enabled` still `false`), returns the secret + `otpauthUrl`.
2. **FE** renders the `otpauthUrl` as a QR code (via `qrcode`) for the user to
   scan, with the raw secret shown as a manual-entry fallback.
3. **Confirm** — user enters the 6-digit code their app produced. BE validates
   it against the stored secret, and if correct: generates 8 recovery codes
   (hashed), and flips `totp_enabled` to `true` — all in **one DB
   transaction**, so a failure partway through rolls back cleanly instead of
   leaving 2FA "half enabled".
4. The 8 plaintext recovery codes are shown to the user **once** (the hashes
   are all the BE ever stores) and never shown again.

### Logging in with 2FA enabled

1. `POST /api/auth/login` (email + password) succeeds, but since
   `totp_enabled` is true, **no full session is created**. Instead, a
   server-only, encrypted session field `secure.pendingTotpUserId` is set, and
   the response carries `totpRequired: true`.
2. The FE shows a code-entry prompt instead of navigating to the app ("Enter
   the 6-digit code..." with a "use a recovery code instead" fallback).
3. `POST /api/auth/totp/verify` (code) or `.../totp/recovery` (recovery code)
   validates against the pending user, then **replaces** the session (clears
   `pendingTotpUserId`, sets the real `user`) — only now is the user actually
   logged in.
4. Any route gated by `requireUserSession` naturally rejects requests in
   between steps 1 and 3, since `session.user` isn't set yet.

### Disabling 2FA

Clears `totp_secret`, sets `totp_enabled` back to `false`. (Re-authentication
before disabling, e.g. requiring the current password or a TOTP code, is a
known gap — see Security notes below.)

## Request flow (BE ⇄ BFF ⇄ FE)

```
FE (Vue)              BFF (web, Nuxt)                    BE (user-service)
───────────────────────────────────────────────────────────────────────────
TwoFactAuth.vue   ──▶  /api/auth/totp/setup        ──▶  /internal/totp/setup
TwoFactSetupModal ──▶  /api/auth/totp/enable       ──▶  /internal/totp/enable
login.vue         ──▶  /api/auth/totp/verify       ──▶  /internal/totp/verify
login.vue         ──▶  /api/auth/totp/recovery     ──▶  /internal/totp/recovery-code/consume
TwoFactAuth.vue   ──▶  /api/auth/totp/disable      ──▶  /internal/totp/disable
```

The BFF never trusts a client-supplied `userId`; every authenticated internal
BE route derives the caller's identity from a signed Bearer token
(`getServiceUserId(event)`, verified via `jose`), matching the convention used
by every other authenticated route (`friends/*`, `chats/*`, `users/me.get.ts`,
etc.).

## Key files

**BE (`services/user/server/`)**
- `routes/internal/totp/setup.post.ts`
- `routes/internal/totp/enable.post.ts`
- `routes/internal/totp/verify.post.ts`
- `routes/internal/totp/disable.post.ts`
- `routes/internal/totp/recovery-code/consume.post.ts`
- `utils/auth.ts` — `getServiceUserId(event)`
- `utils/password.ts` — `passwordHasher` (reused for recovery codes)

**BFF (`web/server/`)**
- `api/auth/login.post.ts` — branches on `totpRequired`
- `api/auth/totp/{setup,enable,verify,recovery,disable}.post.ts`
- `shared/types/auth.d.ts` — `SecureSessionData.pendingTotpUserId`

**FE (`web/app/`)**
- `components/TwoFactAuth.vue` — status text + Enable/Disable button
  (currently mounted on `pages/profile.vue`)
- `components/TwoFactSetupModal.vue` — 3-step wizard (scan QR → confirm code →
  save recovery codes)
- `pages/login.vue` — branches on `totpRequired`, shows a code/recovery-code
  entry step before navigating to `/profile`

## Testing

- `tests/totp/totp_smoke_test.sh` — automated E2E regression test covering
  register → setup → enable → logout → login (2FA) → verify → profile →
  recovery code → disable, against the running BFF (`localhost:3000`). Run it
  any time with:
  ```bash
  ./tests/totp/totp_smoke_test.sh
  ```
- `tests/totp/totp_code.mjs` — dependency-free RFC 6238 code generator, used
  by the smoke test and for manual testing:
  ```bash
  node tests/totp/totp_code.mjs <base32-secret>
  ```
- Full flow has also been manually verified in-browser (QR scan → confirm →
  recovery codes → login prompt → verify/recovery paths → single-use
  enforcement on recovery codes).

## Known gaps / deferred work

- No rate limiting on `verify`/`recovery` attempts.
- No re-authentication (password or TOTP) required before `disable`.
- No confirmation step before disabling 2FA in the FE (intentionally deferred).
- `TwoFactAuth.vue` is temporarily mounted on `pages/profile.vue`;.

