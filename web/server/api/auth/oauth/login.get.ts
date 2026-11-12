import { randomBytes } from "node:crypto";

/* TODECIDE: PKCE implementation for enhanced security */
// This endpoint initiates the OAuth login flow by redirecting the user to the
// provider's authorization URL.
export default defineEventHandler((event) => {
  // Get the runtime configuration for OAuth credentials and redirect URI
  const config = useRuntimeConfig(event);

  // Define the supported OAuth providers and their configuration
  const PROVIDERS: Record<string, { authorizeUrl: string; clientId: string; scope: string }> = {
    "42": {
      authorizeUrl: "https://api.intra.42.fr/oauth/authorize",
      clientId: config.oauth42ClientId,
      scope: "public",
    },
    github: {
      authorizeUrl: "https://github.com/login/oauth/authorize",
      clientId: config.oauthGithubClientId,
      scope: "read:user user:email",
    },
  };
  // Extract the provider from the query parameters and validate it
  const { provider } = getQuery(event);
  // Validate the provider name; hasOwn ignores inherited properties like "constructor"
  if (typeof provider !== "string" || !Object.hasOwn(PROVIDERS, provider)) {
    throw createError({ statusCode: 400, statusMessage: "Unknown provider" });
  }
  const providerConfig = PROVIDERS[provider]
  if (!providerConfig) {
    throw createError({ statusCode: 400, statusMessage: "Unknown provider" });
  }
  // Generate a random state (unique per login attempt) to prevent CSRF attacks
  const state = randomBytes(32).toString("base64url");
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
  // Generate the authorization URL with the required query parameters
  const url = new URL(providerConfig.authorizeUrl);
  url.search = new URLSearchParams({
    client_id: providerConfig.clientId,
    redirect_uri: config.oauthRedirectUri,
    response_type: "code",
    scope: providerConfig.scope,
    state,
  }).toString();

  return sendRedirect(event, url.toString(), 302);
});

/* 
Generated URL example: 
https://api.intra.42.fr/oauth/authorize?client_id=placeholder-42-client-id&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Foauth%2Fcallback&response_type=code&scope=public&state=kqCN7c1EhgFpRtSMhlBWhd75g3v386aqRXybqbcTmPw


BFF Success Response:
HTTP/1.1 302 Found
Location: https://api.intra.42.fr/oauth/authorize?client_id=placeholder-42-client-id&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Foauth%2Fcallback&response_type=code&scope=public&state=kqCN7c1EhgFpRtSMhlBWhd75g3v386aqRXybqbcTmPw
Set-Cookie: oauth_state=kqCN7c1EhgFpRtSMhlBWhd75g3v386aqRXybqbcTmPw; Max-Age=600; Path=/api/auth/oauth; HttpOnly; Secure; SameSite=Lax
*/