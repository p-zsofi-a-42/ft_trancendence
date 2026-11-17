import { and, eq, ne } from 'drizzle-orm'

// Internal route: only the web service calls this, over the Compose network.
// Removes a provider link from the user named in the service token.
// 409 if this would leave the account with no way to log in (no password and no other provider).
export default defineEventHandler(async (event) => {
  const userId = await getServiceUserId(event)
  if (userId === null) {
    setResponseStatus(event, 401)
    return { message: 'Unauthorized' }
  }

  const { provider } = await readJsonBody(event)
  if (typeof provider !== 'string' || !provider) {
    setResponseStatus(event, 400)
    return { message: 'Invalid provider' }
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

  // Perform the unlink operation within a transaction to ensure consistency
  // User needs to have at least one login method remaining (password or another linked provider)
  const result = await db.transaction(async (tx) => {
    const [user] = await tx
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
    if (!user) return 'user-not-found'

    const [link] = await tx
      .select({ id: oauth.id })
      .from(oauth)
      .where(and(eq(oauth.userId, userId), eq(oauth.providerId, providerRow.id)))
      .limit(1)
    if (!link) return 'not-linked'

    const [otherLink] = await tx
      .select({ id: oauth.id })
      .from(oauth)
      .where(and(eq(oauth.userId, userId), ne(oauth.providerId, providerRow.id)))
      .limit(1)
    if (!user.passwordHash && !otherLink) return 'last-login-method'

    await tx.delete(oauth).where(eq(oauth.id, link.id))
    return 'unlinked'
  })

  if (result === 'user-not-found') {
    setResponseStatus(event, 404)
    return { message: 'User not found' }
  }
  if (result === 'not-linked') {
    setResponseStatus(event, 404)
    return { message: 'Provider is not linked' }
  }
  if (result === 'last-login-method') {
    setResponseStatus(event, 409)
    return { message: 'Set a password or link another provider before unlinking this one' }
  }
  return { message: 'Provider unlinked' }
})