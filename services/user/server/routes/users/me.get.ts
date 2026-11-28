import { eq, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await getServiceUserId(event)
  if (userId === null) {
    setResponseStatus(event, 401)
    return { message: 'Unauthorized' }
  }

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      totpEnabled: users.totpEnabled,
      // Only the flag leaves the service, never the hash
      hasPassword: sql<boolean>`${users.passwordHash} IS NOT NULL`,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  if (!user) {
    setResponseStatus(event, 401)
    return { message: 'Unauthorized' }
  }
  return { ...user, id: String(user.id) }
})
