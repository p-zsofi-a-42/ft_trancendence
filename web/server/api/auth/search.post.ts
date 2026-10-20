export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const body = await readBody(event)
  return callUserService('/users/search', { body, userId: user.id })
})
