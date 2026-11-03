export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  return callUserService<{ id: string; name: string; email: string }>('/users/me', { method: 'GET', userId: user.id })
})
