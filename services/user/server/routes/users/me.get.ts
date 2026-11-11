import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await getServiceUserId(event)
  if (userId === null) {
    setResponseStatus(event, 401)
    return { message: 'Unauthorized' }
  }

  const [user] = await db
    .select({ id: users.id, name: users.name, email: users.email, totpEnabled: users.totpEnabled })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  if (!user) {
    setResponseStatus(event, 401)
    return { message: 'Unauthorized' }
  }
  return { ...user, id: String(user.id) }
})
