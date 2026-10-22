// @brief Removes a already accepted friend request or pending request for the current user

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

  // Only the addressee can decline, so the caller must be the addressee of a pending request
  const { rows } = await pool.query(
    `DELETE FROM friendships
     WHERE requester_id = $2 AND addressee_id = $1 AND status = 'accepted'
     RETURNING id`,
    [userId, id],
  )
  if (rows.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'No accepted friendship with this user' })
  }

  return { id, friendship: 'removed' }
})