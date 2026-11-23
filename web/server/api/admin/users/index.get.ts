// Route for fetching a paginated list of users as an admin. Requires the requester to be an admin.
import type { UserPage } from '#shared/types/user'


export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  if (!user.role || user.role !== 'admin') {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized BFF' })
  }
  // Parse pagination parameters from the query string
  const { page, pageSize } = getQuery(event)
  const params = new URLSearchParams()
  if (typeof page === 'string') {
    params.set('page', page)
  }
  if (typeof pageSize === 'string') {
    params.set('pageSize', pageSize)
  }
  const query = params.size > 0 ? `?${params}` : ''
  // call the user service to fetch the paginated list of users
  return callUserService(`/admin/users${query}`, { method: 'GET', userId: user.id })
})