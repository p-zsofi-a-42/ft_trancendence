import { and, eq } from 'drizzle-orm'

// Internal route: only the web service calls this, over the Compose network.
// Attaches a provider identity to the user named in the service token.
// Returns 409 if this user already has that provider linked, or if the identity belongs to another user.
export default defineEventHandler(async (event) => {
  const userId = await getServiceUserId(event)
  if (userId === null) {
    setResponseStatus(event, 401)
    return { message: 'Unauthorized' }
  }

  const { provider, providerUserId, accessTokenEnc, refreshTokenEnc, accessTokenExpiresAt } = await readJsonBody(event)
  const expiresAt = typeof accessTokenExpiresAt === 'string' ? new Date(accessTokenExpiresAt) : null
  if (typeof provider !== 'string' || !provider
    || typeof providerUserId !== 'string' || !providerUserId
    || typeof accessTokenEnc !== 'string' || !accessTokenEnc
    || (refreshTokenEnc != null && typeof refreshTokenEnc !== 'string')
    || (expiresAt !== null && Number.isNaN(expiresAt.getTime())))
  {
    setResponseStatus(event, 400)
    return { message: 'Invalid OAuth link data' }
  }

  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1)
  if (!user) {
    setResponseStatus(event, 404)
    return { message: 'User not found' }
  }

  const [providerRow] = await db
    .select({ id: providers.id })
    .from(providers)
    .where(eq(providers.name, provider))
    .limit(1)
  if (!providerRow) {
    setResponseStatus(event, 400)
    return { message: 'Unknown provider' }
  }

  try {
    const linked = await db.transaction(async (tx) => {
      const [sameUser] = await tx
        .select({ id: oauth.id })
        .from(oauth)
        .where(and(eq(oauth.userId, userId), eq(oauth.providerId, providerRow.id)))
        .limit(1)
      if (sameUser) return 'already-linked'

      const [otherUser] = await tx
        .select({ id: oauth.id })
        .from(oauth)
        .where(and(eq(oauth.providerId, providerRow.id), eq(oauth.providerUserId, providerUserId)))
        .limit(1)
      if (otherUser) return 'identity-taken'

      await tx.insert(oauth).values({
        userId,
        providerId: providerRow.id,
        providerUserId,
        accessTokenEnc,
        accessTokenExpiresAt: expiresAt,
        refreshTokenEnc: typeof refreshTokenEnc === 'string' && refreshTokenEnc ? refreshTokenEnc : null,
      })
      return 'linked'
    })

    if (linked !== 'linked') {
      setResponseStatus(event, 409)
      return { message: linked === 'already-linked'
        ? 'Provider already linked to this account'
        : 'Provider account is linked to another user' }
    }
    return { message: 'Provider linked' }
  } catch (err: any) {
    // Postgres unique_violation: a concurrent request linked the same identity or provider first
    if ((err.code ?? err.cause?.code) === '23505') {
      setResponseStatus(event, 409)
      return { message: 'Provider already linked' }
    }
    throw err
  }
})