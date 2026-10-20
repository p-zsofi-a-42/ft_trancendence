export default defineEventHandler(async (event) => {
  const userId = await getServiceUserId(event)
  if (userId === null) {
    setResponseStatus(event, 401)
    return { message: 'Unauthorized' }
  }

  const { rows } = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [userId])
  if (rows.length === 0) {
    setResponseStatus(event, 401)
    return { message: 'Unauthorized' }
  }
  return rows[0]
})
