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
  await pool.query(
    `DELETE FROM Blocks 
    WHERE blocker_id = $1 AND blocked_id = $2`,
    [userId, id]
  )
  return { id, friendship: 'none' }
})
