
// Route handler for retrieving a user by ID
export default defineEventHandler(async (event) => {
  // throw createError({ statusCode: 401, statusMessage: 'Unauthorized Review' })
  const { user } = await requireUserSession(event)
  if (!user.role || user.role !== 'admin') {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized BFF' })
  }
  const id = getRouterParam(event, 'id') ?? '';
  return callUserService(`/admin/users/${encodeURIComponent(id)}`, {
    method: 'GET', userId: user.id 
  });
});