import { and, eq } from 'drizzle-orm'

// @brief UNBLOCKING USER
//
export default defineEventHandler(async (event) => {
  // Get ID(user to unblock) and user-ID of the requester
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
    throw createError({ statusCode: 400, statusMessage: 'Cannot unblock yourself' })
  }

  // QUERY TO REMOVE BLOCK ENTRY FROM DATABASE
  await db.delete(blocks).where(
    and(eq(blocks.blockerId, userId), eq(blocks.blockedId, Number(id))),
  )
  return { id, friendship: 'none' }
})
