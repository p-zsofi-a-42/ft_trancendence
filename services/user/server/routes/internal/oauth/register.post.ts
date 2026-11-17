import { and, eq } from 'drizzle-orm'

// Internal route: only the web service calls this, over the Compose network.
// Creates a passwordless user and links the provider identity to it in one transaction.
// Returns 409 if the provider identity is already linked (e.g. two simultaneous first logins).
export default defineEventHandler(async (event) => {
  // Read and validate the request body for OAuth registration
  const { provider, providerUserId, accessTokenEnc, refreshTokenEnc, accessTokenExpiresAt, login, email } = await readJsonBody(event)
  const expiresAt = typeof accessTokenExpiresAt === 'string' ? new Date(accessTokenExpiresAt) : null
  if (typeof provider !== 'string' || !provider
    || typeof providerUserId !== 'string' || !providerUserId
    || typeof accessTokenEnc !== 'string' || !accessTokenEnc
    || typeof login !== 'string' || !login
    || (email != null && typeof email !== 'string')
    || (refreshTokenEnc != null && typeof refreshTokenEnc !== 'string')
    || (expiresAt !== null && Number.isNaN(expiresAt.getTime())))
  {
    setResponseStatus(event, 400)
    return { message: 'Invalid OAuth register data' }
  }
  // Lookup the provider in the database
  const [providerRow] = await db
    .select({ id: providers.id })
    .from(providers)
    .where(eq(providers.name, provider))
    .limit(1)
  if (!providerRow) {
    setResponseStatus(event, 400)
    return { message: 'Unknown provider' }
  }

  // Username from the provider login: lowercase, allowed characters only
  const base = login.toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'user'
  const emailValue = email && email.trim() !== '' ? email : null

  try {
    const created = await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ id: oauth.id })
        .from(oauth)
        .where(and(eq(oauth.providerId, providerRow.id), eq(oauth.providerUserId, providerUserId)))
        .limit(1)
      if (existing)
        return null

      // Append -2, -3, ... until the name is free
      let name = base
      for (let n = 2; ; n++) {
        const [taken] = await tx.select({ id: users.id }).from(users).where(eq(users.name, name)).limit(1)
        if (!taken) break
        name = `${base}-${n}`
      }

      const [user] = await tx
        .insert(users)
        .values({ name, email: emailValue, passwordHash: null })
        .returning({ id: users.id, name: users.name, email: users.email })

      await tx.insert(oauth).values({
        userId: user.id,
        providerId: providerRow.id,
        providerUserId,
        accessTokenEnc,
        accessTokenExpiresAt: expiresAt,
        refreshTokenEnc: typeof refreshTokenEnc === 'string' && refreshTokenEnc ? refreshTokenEnc : null,
      })
      return user
    })

    if (!created) {
      setResponseStatus(event, 409)
      return { message: 'Provider account already linked' }
    }
    return {
      message: 'Registration successful',
      user: { id: String(created.id), name: created.name, email: created.email },
      totpRequired: false,
    }
  } catch (err: any) {
    // Postgres unique_violation: a concurrent request took the name or the identity first
    if (err.code === '23505') {
      setResponseStatus(event, 409)
      return { message: 'Username or provider account already taken' }
    }
    throw err
  }
})