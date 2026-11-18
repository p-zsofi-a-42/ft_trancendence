// Route for fetching a paginated list of users as an admin. Requires the requester to be an admin.
import type { User } from '#shared/types/user'


export default defineEventHandler(async (event) => {
  // Here you would typically check if the requester is an admin
  const { user } = await requireUserSession(event)
  if (!user.role || user.role !== 'admin') {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized BFF' })
  }

  // GET user-service /routes/admin/users
  // throw createError({ statusCode: 555, statusMessage: 'role is fine on bff' }) GEEEEEETS HEREEEEEEEEEE
  return callUserService('/admin/users', { method: 'GET', userId: user.id })
  // and then fetch the paginated list of users from the database
})