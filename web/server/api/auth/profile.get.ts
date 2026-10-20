export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  return callUserService('/users/me', { method: 'GET', userId: user.id })
})
