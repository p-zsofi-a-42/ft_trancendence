# Prompt: Unit tests for TOTP 2FA routes

Write unit tests for the TOTP 2FA routes in `services/user/server/routes/internal/totp/`
(`setup.post.ts`, `enable.post.ts`, `verify.post.ts`, `recovery-code/consume.post.ts`,
`disable.post.ts`) and the `totpRequired` field added to
`services/user/server/routes/internal/login.post.ts`.

## Context

- The repo uses Vitest (see `tests/greeting.test.ts` and root `package.json`'s `test`
  script). `services/user` currently has no test setup — check whether it needs its own
  Vitest config/dependency, or whether it should be covered by the root config, and set
  that up first.
- Routes use Nitro's auto-imports (`db`, `users`, `totpRecoveryCodes`, `passwordHasher`,
  `readJsonBody`, `defineEventHandler`, `setResponseStatus`) rather than explicit imports —
  figure out the right way to mock these (e.g. via `vi.mock`, dependency injection, or an
  in-memory/test Postgres instance) without changing the route files' public behavior.
- Schema is in `services/user/server/utils/schema.ts` (`users`, `totpRecoveryCodes`), DB
  client in `services/user/server/utils/db.ts` (drizzle + `pg` Pool), hashing in
  `services/user/server/utils/password.ts` (scrypt-based `passwordHasher`).

## Coverage per route (at minimum)

- **setup.post.ts**: invalid/missing `userId` → 400; unknown user → 404; already-enabled
  user → 409; happy path generates and persists a `totpSecret`, returns a valid base32
  secret + otpauth URL; repeat calls while unconfirmed overwrite the pending secret.
- **enable.post.ts**: invalid/missing `userId`/`code` → 400; unknown user → 404;
  already-enabled → 409; no pending secret → 400; wrong code → 401; happy path flips
  `totpEnabled` to true, persists exactly 8 hashed recovery codes, and returns 8 plaintext
  codes that correctly verify against the stored hashes; verify the update+insert happen
  atomically (e.g. simulate a failure mid-transaction and confirm no partial state
  persists).
- **verify.post.ts**: invalid/missing `userId`/`code` → 400; unknown user → 404; TOTP not
  enabled → 409; wrong code → 401; correct code within the current and adjacent 30s
  windows → 200.
- **recovery-code/consume.post.ts**: invalid/missing `userId`/`code` → 400; unknown user →
  404; TOTP not enabled → 409; wrong/unknown code → 401; correct unused code → 200 and
  marks it `usedAt`; reusing the same code a second time → 401.
- **disable.post.ts**: invalid/missing `userId` → 400; unknown user → 404; not-enabled
  user → 409; happy path clears `totpEnabled`/`totpSecret` and deletes all recovery codes
  for that user atomically.

Also add an integration-style test for `login.post.ts` confirming `totpRequired` is
`true`/`false` matching the user's `totpEnabled` state, without breaking the existing
password-check behavior.

## Conventions

Follow existing repo conventions: concise JSDoc-style comments only where non-obvious, no
unrelated refactors, and run `npm run test` (or the equivalent in `services/user` if a
local script is added) to confirm everything passes before finishing.
