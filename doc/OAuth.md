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

## Register Flow
1. **FE** `Click` **ICON** of provider ===> `oauth/login` (user-service)
2. **BE** `oauth/login` ===> returns "not linked" -> TO *BFF*
3. **BFF** -> *FE* asks for `username` && redirects to `oauth/register` 


### FLOW

#### First contact (no prior consent, no stored tokens)

1. **Browser → WebApp (BFF)**: user clicks the provider icon. The BFF generates a `state` value (and ideally a PKCE `code_verifier`) and stores them in the session.
2. **WebApp → Browser**: 302 redirect to the provider's `/authorize` with `client_id`, `redirect_uri`, `scope`, `state`, and the PKCE challenge.
3. **Browser ↔ Provider**: the user logs in at the provider and sees a consent screen, because this app hasn't been granted access before.
4. **Provider → Browser**: 302 to our `redirect_uri` with a short-lived one-time code and the state.
5. **Browser → WebApp callback**: the BFF checks that `state` matches the stored value.
6. **WebApp → Provider `/token` (server-to-server)**: sends `code`, `client_id`, `client_secret`, `redirect_uri`, and the PKCE verifier. This is the only place the client secret is used.
7. **Provider → WebApp**: `access_token`, and `id_token` if OIDC, plus `refresh_token` if requested.
8. **WebApp → Provider `/userinfo`**: gets the stable provider user ID (`sub`), email, and name.
9. **WebApp → user-service `oauth/login`**: no link for this `sub`, so it returns "not linked". The BFF then runs the register flow from OAuth.md.

#### Returning user (consent and tokens already exist)

* **Fast path with a stored refresh token**: the BFF skips the browser entirely. It calls the provider's `/token` with `grant_type=refresh_token`, `client_id`, `client_secret`, and the stored refresh token, gets a new access token, then calls `/userinfo`.
* **Browser path without a refresh token**: the provider may skip the consent screen and, if its own session is still active, the login screen too. The redirect comes back quickly, but steps 5–8 still run, including the client secret at `/token`.
* **Link exists**: step 9 finds the linked user through sub and goes to the login path. No register step.
* **Revoked access**: if the user removed the app at the provider, the refresh call returns `invalid_grant`. The BFF should fall back to the first-contact flow.


#### What each side holds

| Empty | **WebApp (BFF)** | **Provider auth server** |
|-------|------------------|--------------------------|
| Client secret | Yes, permanently (never sent to the browser) | Verifies it at `/token` |
| `state` / PKCE verifier | Temporarily, per login attempt | Checks the challenge at `/token` |
| Refresh token	| Stored, should be encrypted | Issued and tracked |
| Consent record | Not needed | Stores that the user approved the scopes |
| User's password | Never sees it | Only the provider has it |

##### PKCE verifier:
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