import { and, eq } from 'drizzle-orm'

// Internal route: only the web service calls this, over the Compose network.
// Finds the local user linked to a provider identity and stores the encrypted tokens.
// Returns 404 when no account is linked; the web service must not log in in that case.
export default defineEventHandler(async (event) => {
  const { provider, providerUserId, accessTokenEnc, refreshTokenEnc, accessTokenExpiresAt } = await readJsonBody(event)
  const expiresAt = typeof accessTokenExpiresAt === 'string' ? new Date(accessTokenExpiresAt) : null
  if (typeof provider !== 'string' || !provider
    || typeof providerUserId !== 'string' || !providerUserId
    || typeof accessTokenEnc !== 'string' || !accessTokenEnc
    || (refreshTokenEnc != null && typeof refreshTokenEnc !== 'string')
    || (expiresAt !== null && Number.isNaN(expiresAt.getTime())))
  {
    setResponseStatus(event, 400)
    return { message: 'Invalid OAuth login data' }
  }

  const [link] = await db
    .select({ oauthId: oauth.id, id: users.id, name: users.name, email: users.email, totpEnabled: users.totpEnabled })
    .from(oauth)
    .innerJoin(providers, eq(oauth.providerId, providers.id))
    .innerJoin(users, eq(oauth.userId, users.id))
    .where(and(eq(providers.name, provider), eq(oauth.providerUserId, providerUserId)))
    .limit(1)
  if (!link) {
    setResponseStatus(event, 404)
    return { message: 'No account linked to this provider' }
  }

  await db
    .update(oauth)
    .set({
      accessTokenEnc,
      accessTokenExpiresAt: expiresAt,
      // Keep the stored refresh token when the provider does not send a new one
      ...(typeof refreshTokenEnc === 'string' && refreshTokenEnc ? { refreshTokenEnc } : {}),
    })
    .where(eq(oauth.id, link.oauthId))

  return {
    message: 'Login successful',
    user: { id: String(link.id), name: link.name, email: link.email },
    totpRequired: link.totpEnabled,
  }
})