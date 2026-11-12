/**
 * callback has to finish a login that started in login.get.ts
 * Provider redirects us with:
    On success: https://localhost:3000/api/auth/oauth/callback?code=<one-time code>&state=<state>
    On denial: ...callback?error=access_denied&state=<state>
*/
import { timingSafeEqual } from "node:crypto";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const { code, state, error } = getQuery(event);

  const expectedState = getCookie(event, "oauth_state");
  const provider = getCookie(event, "oauth_provider");
  // One-time use of the state and provider cookies, clear to prevent reuse
  deleteCookie(event, "oauth_state", { path: "/api/auth/oauth" });
  deleteCookie(event, "oauth_provider", { path: "/api/auth/oauth" });

  // Handle error returned by the provider (e.g., user denied access)
  if (error) {
    throw createError({ statusCode: 400, statusMessage: `Provider returned error: ${error}` });
  }
  if (typeof code !== "string" || typeof state !== "string" || !expectedState || !provider) {
    throw createError({ statusCode: 400, statusMessage: "Invalid OAuth callback" });
  }
  // Verify that the state parameter matches the one stored in the cookie to prevent CSRF attacks
  const received = Buffer.from(state);
  const expected = Buffer.from(expectedState);
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    throw createError({ statusCode: 400, statusMessage: "State mismatch" });
  }

  const providers: Record<string, { tokenUrl: string; userUrl: string; clientId: string; clientSecret: string }> = {
    "42": {
      tokenUrl: "https://api.intra.42.fr/oauth/token",
      userUrl: "https://api.intra.42.fr/v2/me",
      clientId: config.oauth42ClientId,
      clientSecret: config.oauth42ClientSecret,
    },
    github: {
      tokenUrl: "https://github.com/login/oauth/access_token",
      userUrl: "https://api.github.com/user",
      clientId: config.oauthGithubClientId,
      clientSecret: config.oauthGithubClientSecret,
    },
  };
  const providerConfig = Object.hasOwn(providers, provider) ? providers[provider] : undefined;
  if (!providerConfig) {
    throw createError({ statusCode: 400, statusMessage: "Unknown provider" });
  }

  // Server-to-server: the client secret never leaves the BFF
  const token = await $fetch<{ access_token: string; refresh_token?: string; expires_in?: number }>(providerConfig.tokenUrl, {
    method: "POST",
    headers: { Accept: "application/json" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: providerConfig.clientId,
      client_secret: providerConfig.clientSecret,
      code,
      redirect_uri: config.oauthRedirectUri,
    }),
  });

  // Fetch the user's profile using the access token obtained from the provider
  const profile = await $fetch<{ id: number | string; login: string; email: string | null }>(
    providerConfig.userUrl,
    { headers: { Authorization: `Bearer ${token.access_token}`, Accept: "application/json" } },
  );

  // Link the provider identity to a local user; the tokens are stored encrypted, never in plaintext
  const accessTokenExpiresAt = token.expires_in ? new Date(Date.now() + token.expires_in * 1000).toISOString() : null;
  const { user, totpRequired } = await callUserService<{
    message: string;
    user: { id: string; name: string; email: string | null };
    totpRequired: boolean;
  }>("/internal/oauth/login", {
    body: {
      provider,
      providerUserId: String(profile.id),
      accessTokenEnc: encryptToken(token.access_token),
      refreshTokenEnc: token.refresh_token ? encryptToken(token.refresh_token) : null,
      accessTokenExpiresAt,
    },
  });

  // The 2FA step lives on the login page, not in this redirect flow, so refuse instead of skipping it
  if (totpRequired) {
    throw createError({ statusCode: 403, statusMessage: "Two-factor authentication is not supported for OAuth login yet" });
  }

  await setUserSession(event, { user });
  return sendRedirect(event, "/profile", 302);
});