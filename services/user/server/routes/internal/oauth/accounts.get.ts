import { eq } from 'drizzle-orm'

// Internal route: only the web service calls this, over the Compose network.
// Returns the provider names (e.g. ['github']) linked to the user named in the service token.
export default defineEventHandler(async (event) => {
  const userId = await getServiceUserId(event)
  if (userId === null) {
    setResponseStatus(event, 401)
    return { message: 'Unauthorized' }
  }

  const rows = await db
    .select({ name: providers.name })
    .from(oauth)
    .innerJoin(providers, eq(oauth.providerId, providers.id))
    .where(eq(oauth.userId, userId))
  return rows.map(row => row.name)
})