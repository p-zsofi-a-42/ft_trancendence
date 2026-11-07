import { and, or, eq } from 'drizzle-orm'

// @brief BLOCKING USER
//
export default defineEventHandler(async (event) => {
  // Get ID(user to block) and user-ID of the requester
  const { id } = await readJsonBody(event)
  if (typeof id !== 'string' || !/^\d+$/.test(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid friend ID' })
  }
  const userId = await getServiceUserId(event)
  if (userId === null) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  // Validate ID
  if (String(userId) === id) {
    throw createError({ statusCode: 400, statusMessage: 'Cannot block yourself' })
  }

  const blockedId = Number(id)

  // Remove any friendship and block the user in one transaction so both happen atomically
  // No friendship -> the DELETE matches zero rows, which is not an error
  try {
    await db.transaction(async (tx) => {
      await tx.delete(friendships).where(
        or(
          and(eq(friendships.requesterId, blockedId), eq(friendships.addresseeId, userId)),
          and(eq(friendships.requesterId, userId), eq(friendships.addresseeId, blockedId)),
        ),
      )
      await tx.insert(blocks).values({ blockerId: userId, blockedId }).onConflictDoNothing()
    })
  } catch (err: any) {
    if ((err.code ?? err.cause?.code) === '23503') {
      throw createError({ statusCode: 404, statusMessage: 'User not found' })
    }
    throw err
  }
  return { id, friendship: 'blocked' }
})
