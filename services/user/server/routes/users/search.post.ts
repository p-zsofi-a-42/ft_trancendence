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
  // Return matching users (not yourself) with their friendship status towards you
  const { rows } = await pool.query(
    `SELECT u.id, u.name,
      CASE
        WHEN f.status = 'accepted' THEN 'friends'
        WHEN f.requester_id = $2 THEN 'outgoing'
        WHEN f.id IS NOT NULL THEN 'incoming'
        ELSE 'none'
      END AS friendship
     FROM users u
     LEFT JOIN friendships f
       ON (f.requester_id = $2 AND f.addressee_id = u.id)
       OR (f.requester_id = u.id AND f.addressee_id = $2)
     WHERE u.name ILIKE $1 AND u.id <> $2
      AND NOT EXISTS (
        SELECT 1 FROM blocks b
        WHERE (b.blocker_id = $2 AND b.blocked_id = u.id)
           OR (b.blocker_id = u.id AND b.blocked_id = $2)
      )
      ORDER BY u.name
     LIMIT 20`,
    [`${escaped}%`, userId],
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