// list users blcoked from the authenticated user
export default defineEventHandler(async (event) => {
  const userId = await getServiceUserId(event)
  if (userId === null) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const { rows } = await pool.query(
    `SELECT u.id, u.name
     FROM blocks b
     JOIN users u ON u.id = b.blocked_id
     WHERE b.blocker_id = $1
     ORDER BY u.name`,
    [userId]
  )

  return rows
})