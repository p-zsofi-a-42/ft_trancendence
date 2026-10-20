export default defineEventHandler(async (event) => {
  // Get the ID of the service user making the request
  const userId = await getServiceUserId(event)
  if (userId === null) {
    setResponseStatus(event, 401)
    return { message: 'Unauthorized' }
  }

  // Read the search query from the request body
  const { query } = await readJsonBody(event)
  if (typeof query !== 'string') {
    setResponseStatus(event, 400)
    return { message: 'Invalid search data' }
  }

  // Trim the search query and return early if it's empty
  const term = query.trim()
  if (!term) return []

  // Escape LIKE wildcards so "%" and "_" match literally (Postgres uses "\" as the default escape).
  const escaped = term.replace(/[\\%_]/g, '\\$&')

  // Use the simple query for now, return results matching the beginning of the search term
  const { rows } = await pool.query(
  'SELECT id, name FROM users WHERE name ILIKE $1 ORDER BY name LIMIT 20',
  [`${escaped}%`],
)
  return rows
})
// Other Queries
  // Names starting with the term sort first, then the rest alphabetically.
  // const { rows } = await pool.query(
  //   `SELECT id, name FROM users
  //    WHERE name ILIKE $1
  //    ORDER BY (name ILIKE $2) DESC, name
  //    LIMIT 20`,
  //   [`${escaped}%`, `${escaped}%`],
  // )

  // const { rows } = await pool.query(
  //   'SELECT id, name FROM users WHERE name ILIKE $1 ORDER BY name LIMIT 20',
  //   [`${query}`],
  // )