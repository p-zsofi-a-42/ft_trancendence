import { and, or, eq, ne, ilike, notExists, sql } from 'drizzle-orm'

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
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      status: friendships.status,
      requesterId: friendships.requesterId,
      friendshipId: friendships.id,
    })
    .from(users)
    .leftJoin(
      friendships,
      or(
        and(eq(friendships.requesterId, userId), eq(friendships.addresseeId, users.id)),
        and(eq(friendships.requesterId, users.id), eq(friendships.addresseeId, userId)),
      ),
    )
    .where(
      and(
        ilike(users.name, `${escaped}%`),
        ne(users.id, userId),
        notExists(
          db.select({ one: sql`1` }).from(blocks).where(
            or(
              and(eq(blocks.blockerId, userId), eq(blocks.blockedId, users.id)),
              and(eq(blocks.blockerId, users.id), eq(blocks.blockedId, userId)),
            ),
          ),
        ),
      ),
    )
    .orderBy(users.name)
    .limit(20)

  return rows.map((row) => ({
    id: String(row.id),
    name: row.name,
    friendship:
      row.status === 'accepted' ? 'friends'
      : row.requesterId === userId ? 'outgoing'
      : row.friendshipId !== null ? 'incoming'
      : 'none',
  }))
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