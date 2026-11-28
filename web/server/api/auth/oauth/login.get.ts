import { createHash, randomBytes } from "node:crypto";

// This endpoint initiates the OAuth login flow by redirecting the user to the
// provider's authorization URL.
export default defineEventHandler(async (event) => {
  // Get the runtime configuration for OAuth credentials and redirect URI
  const config = useRuntimeConfig(event);

  // Define the supported OAuth providers and their configuration
  const PROVIDERS: Record<string, { authorizeUrl: string; clientId: string; scope: string }> = {
    github: {
      authorizeUrl: "https://github.com/login/oauth/authorize",
      clientId: config.oauthGithubClientId,
      scope: "read:user user:email",
    },
  };
  // Extract the provider from the query parameters and validate it
  const { provider, intent } = getQuery(event);
  // Validate the provider name; hasOwn ignores inherited properties like "constructor"
  if (typeof provider !== "string" || !Object.hasOwn(PROVIDERS, provider)) {
    throw createError({ statusCode: 400, statusMessage: "Unknown provider" });
  }
  const providerConfig = PROVIDERS[provider]
  if (!providerConfig) {
    throw createError({ statusCode: 400, statusMessage: "Unknown provider" });
  }

  // Linking attaches a provider to the current account, so it requires an active session
  const isLink = intent === "link";
  if (isLink) {
    // Anonymous visitors go to the login page instead of getting a raw 401
    const { user } = await getUserSession(event);
    if (!user) {
      return sendRedirect(event, "/login", 302);
    }
  }

  // Generate a random state (unique per login attempt) to prevent CSRF attacks
  const state = randomBytes(32).toString("base64url");
  // PKCE: the verifier stays in a cookie, only its S256 hash goes to the provider
  const codeVerifier = randomBytes(32).toString("base64url");
  const codeChallenge = createHash("sha256").update(codeVerifier).digest("base64url");
  // Both cookies are read by the callback: the same attributes apply to each
  const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const, // must be Lax: the provider redirects back cross-site
    path: "/api/auth/oauth",
    maxAge: 600, // in seconds
  };
  setCookie(event, "oauth_state", state, cookieOptions);
  setCookie(event, "oauth_provider", provider, cookieOptions);
  setCookie(event, "oauth_intent", isLink ? "link" : "login", cookieOptions);
  setCookie(event, "oauth_pkce", codeVerifier, cookieOptions);
  
  // Generate the authorization URL with the required query parameters
  const url = new URL(providerConfig.authorizeUrl);
  url.search = new URLSearchParams({
    client_id: providerConfig.clientId,
    redirect_uri: config.oauthRedirectUri,
    response_type: "code",
    scope: providerConfig.scope,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  }).toString();

  return sendRedirect(event, url.toString(), 302);
});

/* 
Generated URL example: 
https://github.com/login/oauth/authorize?client_id=placeholder-github-client-id&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Foauth%2Fcallback&response_type=code&scope=read%3Auser+user%3Aemail&state=kqCN7c1EhgFpRtSMhlBWhd75g3v386aqRXybqbcTmPw&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&code_challenge_method=S256


BFF Success Response:
HTTP/1.1 302 Found
Location: https://github.com/login/oauth/authorize?client_id=placeholder-github-client-id&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Foauth%2Fcallback&response_type=code&scope=read%3Auser+user%3Aemail&state=kqCN7c1EhgFpRtSMhlBWhd75g3v386aqRXybqbcTmPw&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&code_challenge_method=S256
Set-Cookie: oauth_state=kqCN7c1EhgFpRtSMhlBWhd75g3v386aqRXybqbcTmPw; Max-Age=600; Path=/api/auth/oauth; HttpOnly; Secure; SameSite=Lax
*/