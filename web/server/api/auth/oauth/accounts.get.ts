export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  return callUserService<string[]>('/internal/oauth/accounts', { method: 'GET', userId: user.id })
})
