import { and, or, eq, notExists, sql } from 'drizzle-orm'

/**
 * @Returns the list of friends and friend requests for the authenticated user
 */
export default defineEventHandler(async (event) => {
  const userId = await getServiceUserId(event)
  if (userId === null) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  // One row per friendship involving the caller, with the other user's name
  const rows = await db
    .select({ id: users.id, name: users.name, status: friendships.status, requesterId: friendships.requesterId })
    .from(friendships)
    .innerJoin(
      users,
      sql`${users.id} = CASE WHEN ${friendships.requesterId} = ${userId} THEN ${friendships.addresseeId} ELSE ${friendships.requesterId} END`,
    )
    .where(
      and(
        or(eq(friendships.requesterId, userId), eq(friendships.addresseeId, userId)),
        notExists(
          db.select({ one: sql`1` }).from(blocks).where(
            or(
              and(eq(blocks.blockerId, userId), eq(blocks.blockedId, users.id)),
              and(eq(blocks.blockerId, users.id), eq(blocks.blockedId, userId)),
            ),
          ),
        ),
      ),
    )
    .orderBy(users.name)

  return rows.map((row) => ({
    id: String(row.id),
    name: row.name,
    friendship: row.status === 'accepted' ? 'friends' : row.requesterId === userId ? 'outgoing' : 'incoming',
  }))
})
