// Route for fetching one page of users as an admin. Requires the requester to be an admin.
import { requireAdmin } from '~/utils/auth'
import { asc, count } from 'drizzle-orm'

const MAX_PAGE_SIZE = 100

// Utility function to parse and validate pagination parameters from the query string
function parseIntParam(raw: unknown, fallback: number, max = Number.MAX_SAFE_INTEGER): number {
  if (raw === undefined || raw === '') return fallback
  if (typeof raw !== 'string' || !/^\d+$/.test(raw)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid pagination parameters' })
  }
  const value = Number(raw)
  if (value < 1 || value > max) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid pagination parameters' })
  }
  return value
}

// Route handler for fetching a paginated list of users as an admin
// Returns a paginated list of users with their basic information and total count.
// Query parameters:
// - page: the page number (default: 1)
// - pageSize: the number of items per page (default: 10, max: 100)
export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event)
  } catch (error) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized Backend' })
  }
  // Parse query parameters for pagination
  const query = getQuery(event)
  const page = parseIntParam(query.page, 1)
  const pageSize = parseIntParam(query.pageSize, 10, MAX_PAGE_SIZE)
  // Fetch the paginated list of users and the total count concurrently
  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        totpEnabled: users.totpEnabled,
      })
      .from(users)
      .orderBy(asc(users.id)) // stable order so pages don't overlap
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: count() }).from(users),
  ])
  // Return the paginated list of users along with the total count and pagination info
  return { items: rows, total, page, pageSize }
})