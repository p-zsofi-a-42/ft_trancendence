// Returns the list of friends and friend requests for the authenticated user
export default defineEventHandler(async (event) => {
  const userId = await getServiceUserId(event)
  if (userId === null) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  // One row per friendship involving the caller, with the other user's name
  const { rows } = await pool.query(
    `SELECT u.id, u.name, f.status, f.requester_id = $1 AS is_requester
    FROM friendships f
    JOIN users u
      ON u.id = CASE WHEN f.requester_id = $1 THEN f.addressee_id ELSE f.requester_id END
    WHERE $1 IN (f.requester_id, f.addressee_id)
    AND NOT EXISTS (
      SELECT 1 FROM blocks b
      WHERE (b.blocker_id = $1 AND b.blocked_id = u.id)
         OR (b.blocker_id = u.id AND b.blocked_id = $1)
    )
    ORDER BY u.name`,
    [userId],
  )

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    friendship: row.status === 'accepted' ? 'friends' : row.is_requester ? 'outgoing' : 'incoming',
  }))
})
