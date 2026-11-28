# OAuth implemention

## FLOW

### First contact (no prior consent, no stored tokens)

1. **Browser → WebApp (BFF)**: user clicks the provider icon. The BFF generates a `state` value and a PKCE `code_verifier`, and stores them in the `oauth_state` and `oauth_pkce` cookies.
2. **WebApp → Browser**: 302 redirect to the provider's `/authorize` with `client_id`, `redirect_uri`, `scope`, `state`, and the PKCE challenge (`code_challenge` and `code_challenge_method=S256`).
3. **Browser ↔ Provider**: the user logs in at the provider and sees a consent screen, because this app hasn't been granted access before.
4. **Provider → Browser**: 302 to our `redirect_uri` with a short-lived one-time code and the state.
5. **Browser → WebApp callback**: the BFF checks that `state` matches the stored value.
6. **WebApp → Provider `/token` (server-to-server)**: sends `code`, `client_id`, `client_secret`, `redirect_uri`, and the PKCE verifier. This is the only place the client secret is used.
7. **Provider → WebApp**: `access_token`, and `id_token` if OIDC, plus `refresh_token` if requested.
8. **WebApp → Provider `/userinfo`**: gets the stable provider user ID (`sub`), email, and name.
9. **WebApp → user-service `oauth/login`**: no link for this `sub`, so it returns 404 "not linked". The BFF then calls `oauth/register`, which creates the account (see *Register on first use*).


### Returning user (consent and tokens already exist)

* **Fast path with a stored refresh token**: the BFF skips the browser entirely. It calls the provider's `/token` with `grant_type=refresh_token`, `client_id`, `client_secret`, and the stored refresh token, gets a new access token, then calls `/userinfo`.
* **Browser path without a refresh token**: the provider may skip the consent screen and, if its own session is still active, the login screen too. The redirect comes back quickly, but steps 5–8 still run, including the client secret at `/token`.
* **Link exists**: step 9 finds the linked user through sub and goes to the login path. No register step.
* **Revoked access**: if the user removed the app at the provider, the refresh call returns `invalid_grant`. The BFF should fall back to the first-contact flow.


### Register on first use

If `oauth/login` returns 404, the callback calls user-service `oauth/register`. In one transaction it creates a user with no password and the `oauth` row. The username is the provider login, lowercased, with allowed characters only. A numeric suffix (`-2`, `-3`, ...) is added if the name is taken. The provider email is stored (lowercased) only if no other account uses it; otherwise the account is created with no email and is not linked to that account. The response has the same shape as login, so the session is set the same way.

Accounts created this way have no password. Password login rejects them with 401.


### Linking a provider to an existing account

1. **Profile page**: loads the linked provider names through `GET /api/auth/oauth/accounts`, which proxies to user-service `GET /internal/oauth/accounts`. The "Link GitHub" button shows only when `github` isn't in that list.
2. **Browser → BFF**: the button goes to `/api/auth/oauth/login?provider=github&intent=link`. Without a session, the BFF redirects to `/login`. With one, it sets the `oauth_intent=link` cookie next to the state and provider cookies.
3. **Callback**: with `intent=link`, the BFF requires the session and calls user-service `oauth/link`. The user ID comes from the service token, never from the request body. The session is not changed.
4. **Result**: success redirects to `/profile?oauth=linked`. A 409 redirects to `/profile?oauth=link_conflict`. A 409 means either this account already has that provider, or the identity belongs to another user. The profile page shows a toast for either parameter and then clears the query string.


### What each side holds

| Empty | **WebApp (BFF)** | **Provider auth server** |
|-------|------------------|--------------------------|
| Client secret | Yes, permanently (never sent to the browser) | Verifies it at `/token` |
| `state` / PKCE verifier | Temporarily, per login attempt | Checks the challenge at `/token` |
| Refresh token	| Stored, should be encrypted | Issued and tracked |
| Consent record | Not needed | Stores that the user approved the scopes |
| User's password | Never sees it | Only the provider has it |

#### PKCE verifier:
- ***P*roof *K*ey for *C*ode *E*xchange**
- rand-secret, created by WebApp for each login attempt.
- proves app which started login, same app that finishes it.
- designed for apps that can't keep client secret safe. *Recommended to use sind OAuth 2.1*

**How it works**
1. **Create the verifier**: the BFF generates a high-entropy random string, 43–128 characters, for this login attempt only. It is stored in the one-time `oauth_pkce` cookie (same attributes as `oauth_state`).
2. **Derive the challenge**: `code_challenge = BASE64URL(SHA256(code_verifier))`. This is the `S256` method.
3. **Send only the challenge**: the `/authorize` redirect includes `code_challenge` and `code_challenge_method=S256`. The verifier never leaves the BFF at this step.
4. **Prove possession**: the callback reads `oauth_pkce`, clears it, and sends the raw `code_verifier` to `/token`. The provider hashes it, compares the result with the stored challenge, and issues tokens only if they match. A missing cookie is rejected with 400.

**Provider support**
- Only GitHub is configured. GitHub documents `code_challenge` and `code_challenge_method=S256` for its web flow.

--- 

### Points to keep in mind

- Browser only sees redirects and cookies. The client_secret, the provider's access token, and the profile fetch all stay between the BFF and the provider.
- Unlinked accounts are registered on first use (see *Register on first use*), so they no longer stop at step 6.
- 2FA accounts that log in with OAuth get the same TOTP step as password logins: the callback stores the pending marker and redirects to `/login?totp=required`, where the code form is shown.
- Possible bug in step 4 with GitHub: GitHub's token endpoint can return HTTP 200 with an error body, for example for a bad or reused code. $fetch won't throw in that case, so token.access_token is undefined and encryptToken fails with a 500. Checking for token.error before step 5 would give a clear 400 instead.

### TODO & TODECIDE

#### Missing features
* `Refresh and revocation`: refresh_token_enc is stored, but nothing uses it. Expired tokens, invalid_grant on refresh, and decryption are all still missing.
* `Error UI`: errors from the OAuth routes come back as raw JSON or 400/403 responses. Only link results have a UI so far (a toast on `/profile`).

## ASCII DIAGRAM (Flow)
```text
Browser                   BFF (web)                 Provider                user-service
   |                          |                         |                         |
1  |GET /login?provider=github|                         |                         |
   |------------------------->|                         |                         |
   |                          | validate provider       |                         |
   |                          | state = random(32)      |                         |
   | 302 + Set-Cookie         |                         |                         |
   |<-------------------------|                         |                         |
   |                          |                         |                         |
2  | GET /oauth/authorize     |                         |                         |
   |--------------------------------------------------->|                         |
   |                          |                         | login + consent         |
   | 302 + code & state       |                         |                         |
   |<---------------------------------------------------|                         |
   |                          |                         |                         |
3  | GET /callback?code&state |                         |                         |
   |------------------------->|                         |                         |
   |                          | clear cookies           |                         |
   |                          | error? -> 400           |                         |
   |                          | state == cookie?        |                         |
   |                          | provider valid?         |                         |
   |                          |                         |                         |
4  |                          | POST token endpoint     |                         |
   |                          |------------------------>|                         |
   |                          |                         | client_secret + PKCE    |
   |                          | access_token            |                         |
   |                          |<------------------------|                         |
   |                          |                         |                         |
5  |                          | GET profile (Bearer)    |                         |
   |                          |------------------------>|                         |
   |                          | {id, login, email}      |                         |
   |                          |<------------------------|                         |
   |                          |                         |                         |
6  |                          | encrypt tokens          |                         |
   |                          | AES-256-GCM             |                         |
   |                          | POST oauth login        |                         |
   |                          |-------------------------------------------------->|
   |                          |                         |                         | find user by provider
   |                          |                         |                         | + provider_user_id
   |                          |                         |                         | none -> 404
   |                          |                         |                         | else UPDATE oauth
   |                          | {user, totpRequired}    |                         |
   |                          |<--------------------------------------------------|
   |                          | totp on? -> pending marker only   |                         |
   |                          | setUserSession(secure)  |                         |
   |                          |                         |                         |
7  | 302 /profile or /login?totp=required + session |   |                         |
   |<-------------------------|                         |                         |
```