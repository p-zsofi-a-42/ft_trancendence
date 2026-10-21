export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const body = await readBody(event)
  return callUserService<{ id: string; name: string }[]>('/friends/add', { body, userId: user.id })
})