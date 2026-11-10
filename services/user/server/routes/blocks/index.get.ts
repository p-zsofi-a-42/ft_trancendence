import { eq } from 'drizzle-orm'

// list users blcoked from the authenticated user
export default defineEventHandler(async (event) => {
  const userId = await getServiceUserId(event)
  if (userId === null) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const rows = await db
    .select({ id: users.id, name: users.name })
    .from(blocks)
    .innerJoin(users, eq(users.id, blocks.blockedId))
    .where(eq(blocks.blockerId, userId))
    .orderBy(users.name)

  return rows.map((row) => ({ id: String(row.id), name: row.name }))
})