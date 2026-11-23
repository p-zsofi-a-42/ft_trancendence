// Route for fetching a paginated list of users as an admin. Requires the requester to be an admin.
import type { UserPage } from '#shared/types/user'

const FORWARDED_KEYS = [
  'q', 'role', 'totpEnabled', 'createdFrom', 'createdTo', 'sort', 'order', 'page', 'pageSize',
] as const

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  if (!user.role || user.role !== 'admin') {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized BFF' })
  }

  // Forward only the known query params; empty and repeated values are skipped
  const incoming = getQuery(event)
  const params = new URLSearchParams()
  for (const key of FORWARDED_KEYS) {
    const value = incoming[key]
    if (typeof value === 'string' && value !== '') params.set(key, value)
  }
  const query = params.size > 0 ? `?${params}` : ''

  return callUserService<UserPage>(`/admin/users${query}`, { method: 'GET', userId: user.id })
})