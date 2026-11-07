import { and, or, eq, notExists, sql } from 'drizzle-orm'

// Accepts a pending friend request for the authenticated user from the specified requester ID
export default defineEventHandler(async (event) => {
  // The requester's ID, sent by the frontend
  const { id } = await readJsonBody(event)
  if (typeof id !== 'string' || !/^\d+$/.test(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid friend ID' })
  }

  const userId = await getServiceUserId(event)
  if (userId === null) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const friendId = Number(id)

  const [res] = await db
    .update(friendships)
    .set({ status: 'accepted' , updatedAt: new Date() })
    .where(
      and(
        eq(friendships.requesterId, friendId),
        eq(friendships.addresseeId, userId),
        eq(friendships.status, 'pending'),
        notExists(
          db.select({ one: sql`1` }).from(blocks).where(
            or(
             and(eq(blocks.blockerId, userId), eq(blocks.blockedId, friendId)),
             and(eq(blocks.blockerId, friendId), eq(blocks.blockedId, userId)),
           ),
          ),
        ),
      ),
    )
    .returning({ id: friendships.id })

  if (!res) {
    throw createError({ statusCode: 404, statusMessage: 'No pending request from this user' })
  }

  return { id, friendship: 'friends' }
})
