// Route for fetching a filtered, sorted, paginated list of users as an admin. Requires the requester to be an admin.
import { requireAdmin } from '~/utils/auth'
import { and, asc, count, desc, eq, gte, ilike, lt, type SQL } from 'drizzle-orm'

const MAX_PAGE_SIZE = 100
const MAX_SEARCH_LENGTH = 100
const DAY_MS = 24 * 60 * 60 * 1000

// Whitelist of sortable columns. Only these keys are accepted from the query string.
const SORT_COLUMNS = {
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
  createdAt: users.createdAt,
} as const
type SortField = keyof typeof SORT_COLUMNS

function invalid(): never {
  throw createError({ statusCode: 400, statusMessage: 'Invalid query parameters' })
}

function parseIntParam(raw: unknown, fallback: number, max = Number.MAX_SAFE_INTEGER): number {
  if (raw === undefined || raw === '') return fallback
  if (typeof raw !== 'string' || !/^\d+$/.test(raw)) invalid()
  const value = Number(raw)
  if (value < 1 || value > max) invalid()
  return value
}

function parseChoice<T extends string>(raw: unknown, allowed: readonly T[]): T | undefined {
  if (raw === undefined || raw === '') return undefined
  if (typeof raw !== 'string' || !(allowed as readonly string[]).includes(raw)) invalid()
  return raw as T
}

function parseText(raw: unknown): string | undefined {
  if (raw === undefined || raw === '') return undefined
  if (typeof raw !== 'string' || raw.length > MAX_SEARCH_LENGTH) invalid()
  const term = raw.trim()
  return term === '' ? undefined : term
}

function parseDate(raw: unknown): Date | undefined {
  if (raw === undefined || raw === '') return undefined
  if (typeof raw !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) invalid()
  const time = Date.parse(raw)
  if (Number.isNaN(time)) invalid()
  return new Date(time)
}

// Escape LIKE wildcards so "%" and "_" in the search term match literally
const escapeLike = (term: string) => term.replace(/[\\%_]/g, '\\$&')

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event)
  } catch (error) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized Backend' })
  }

  const query = getQuery(event)
  const page = parseIntParam(query.page, 1)
  const pageSize = parseIntParam(query.pageSize, 10, MAX_PAGE_SIZE)
  const q = parseText(query.q)
  const role = parseChoice(query.role, ['user', 'admin'] as const)
  const totpEnabled = parseChoice(query.totpEnabled, ['true', 'false'] as const)
  const createdFrom = parseDate(query.createdFrom)
  const createdTo = parseDate(query.createdTo)
  const sort = parseChoice(query.sort, Object.keys(SORT_COLUMNS) as SortField[]) ?? 'id'
  const order = parseChoice(query.order, ['asc', 'desc'] as const) ?? 'asc'

  const conditions: SQL[] = []
  if (q) conditions.push(ilike(users.name, `%${escapeLike(q)}%`))
  if (role) conditions.push(eq(users.role, role))
  if (totpEnabled) conditions.push(eq(users.totpEnabled, totpEnabled === 'true'))
  if (createdFrom) conditions.push(gte(users.createdAt, createdFrom))
  // createdTo is inclusive of the whole day
  if (createdTo) conditions.push(lt(users.createdAt, new Date(createdTo.getTime() + DAY_MS)))
  const where = conditions.length > 0 ? and(...conditions) : undefined

  const sortColumn = SORT_COLUMNS[sort]
  const direction = order === 'desc' ? desc(sortColumn) : asc(sortColumn)

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
      .where(where)
      .orderBy(direction, asc(users.id)) // id as tiebreaker keeps pages from overlapping
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: count() }).from(users).where(where),
  ])

  return { items: rows, total, page, pageSize }
})