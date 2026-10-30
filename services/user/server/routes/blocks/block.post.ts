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

  // remove friendship and block user via a data-modifying CTE (ensures both actions happen atomically)
  // No friendship -> the DELETE matches zero rows, which is not an error
  try {
    await pool.query(
      `WITH removed AS (
        DELETE FROM Friendships 
        WHERE (requester_id = $2 AND addressee_id = $1) 
        OR (requester_id = $1 AND addressee_id = $2)
      )
      INSERT INTO Blocks (blocker_id, blocked_id) VALUES ($1, $2)
      ON CONFLICT DO NOTHING`,
      [userId, id]
    )
  } catch (err: any) {
    if (err.code === '23503') {
      throw createError({ statusCode: 404, statusMessage: 'User not found' })
    }
    throw err
  }
  return { id, friendship: 'blocked' }
})
