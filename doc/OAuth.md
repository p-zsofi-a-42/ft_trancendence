# OAuth implemention

## Change current code
- login -> via username and not email
- registration -> email becomes optional
- Database -> user TABLE -> 
	- username -> UNIQUE
	- email -> gets optional

*Typescript* -> for password and email -> `string | null`.

## Infrastructure to store OAuth
- [] **Client Id & client secret**
	- [] register to provider app
	- [] lives in env-config || `secrets/`


## FLOW

### First contact (no prior consent, no stored tokens)

1. **Browser → WebApp (BFF)**: user clicks the provider icon. The BFF generates a `state` value (and ideally a PKCE `code_verifier`) and stores them in the session.
2. **WebApp → Browser**: 302 redirect to the provider's `/authorize` with `client_id`, `redirect_uri`, `scope`, `state`, and the PKCE challenge.
3. **Browser ↔ Provider**: the user logs in at the provider and sees a consent screen, because this app hasn't been granted access before.
4. **Provider → Browser**: 302 to our `redirect_uri` with a short-lived one-time code and the state.
5. **Browser → WebApp callback**: the BFF checks that `state` matches the stored value.
6. **WebApp → Provider `/token` (server-to-server)**: sends `code`, `client_id`, `client_secret`, `redirect_uri`, and the PKCE verifier. This is the only place the client secret is used.
7. **Provider → WebApp**: `access_token`, and `id_token` if OIDC, plus `refresh_token` if requested.
8. **WebApp → Provider `/userinfo`**: gets the stable provider user ID (`sub`), email, and name.
9. **WebApp → user-service `oauth/login`**: no link for this `sub`, so it returns "not linked". The BFF then runs the register flow from OAuth.md.


### Returning user (consent and tokens already exist)

* **Fast path with a stored refresh token**: the BFF skips the browser entirely. It calls the provider's `/token` with `grant_type=refresh_token`, `client_id`, `client_secret`, and the stored refresh token, gets a new access token, then calls `/userinfo`.
* **Browser path without a refresh token**: the provider may skip the consent screen and, if its own session is still active, the login screen too. The redirect comes back quickly, but steps 5–8 still run, including the client secret at `/token`.
* **Link exists**: step 9 finds the linked user through sub and goes to the login path. No register step.
* **Revoked access**: if the user removed the app at the provider, the refresh call returns `invalid_grant`. The BFF should fall back to the first-contact flow.


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
1. **Create the verifier**: the BFF generates a high-entropy random string, 43–128 characters, for this login attempt only.
2. **Derive the challenge**: `code_challenge = BASE64URL(SHA256(code_verifier))`. This is the `S256` method.
3. **Send only the challenge**: the `/authorize` redirect includes `code_challenge` and `code_challenge_method=S256`. The verifier never leaves the BFF at this step.
4. **Prove possession**: at `/token`, the BFF sends the raw `code_verifier`. The provider hashes it, compares the result with the stored challenge, and issues tokens only if they match.


---

- [] db/schema.sql
- [] utils/schema.ts (user-service)

--- 

### Points to keep in mind

- Browser only sees redirects and cookies. The client_secret, the provider's access token, and the profile fetch all stay between the BFF and the provider.
- Unlinked accounts stop at step 6. user-service returns 404, so no session is created. The register flow doesn't exist yet.
- 2FA accounts stop at step 6 too, with 403, until the TOTP step is wired in.
- Possible bug in step 4 with GitHub: GitHub's token endpoint can return HTTP 200 with an error body, for example for a bad or reused code. $fetch won't throw in that case, so token.access_token is undefined and encryptToken fails with a 500. Checking for token.error before step 5 would give a clear 400 instead.

### TODO & TODECIDE

#### Missing features
* `Register flow for unlinked accounts`: user-service returns 404 for a provider identity that isn't linked, and the callback doesn't create an account yet.
* `2FA for OAuth logins`: accounts with TOTP enabled get a 403. The TOTP step has to be added to the redirect flow.
* `Refresh and revocation`: refresh_token_enc is stored, but nothing uses it. Expired tokens, invalid_grant on refresh, and decryption are all still missing.
* `PKCE`: still undecided. I haven't confirmed that 42 accepts PKCE parameters.
* `User-service stubs`: accounts.get.ts, link.post.ts and unlink.post.ts are still comment-only.
* `Error UI`: errors come back as raw JSON or 400/403 responses. There's no error page or toast on the login page.

## ASCII DIAGRAM (Flow)
```text
Browser                   BFF (web)                 Provider                user-service
   |                          |                         |                         |
1  | GET /login?provider=42   |                         |                         |
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
   |                          |                         | client_secret used      |
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
   |                          | totp on? -> 403         |                         |
   |                          | setUserSession          |                         |
   |                          |                         |                         |
7  | 302 /profile + session   |                         |                         |
   |<-------------------------|                         |                         |
```