import { and, eq, or} from 'drizzle-orm'

/**
 * @brief Removes a already accepted friend request or pending request for the current user

*/
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
  // Remove an accepted friendship between the current user and the specified friend ID
  const [res] = await db
    .delete(friendships)
    .where(
      and(
        or(
          and(eq(friendships.requesterId, userId), eq(friendships.addresseeId, friendId)),
          and(eq(friendships.requesterId, friendId), eq(friendships.addresseeId, userId)),
        ),
        eq(friendships.status, 'accepted')
      ),
    )
    .returning({ id: friendships.id })
  if (!res) {
    throw createError({ statusCode: 404, statusMessage: 'No accepted friendship with this user' })
  }

  return { id, friendship: 'removed' }
})