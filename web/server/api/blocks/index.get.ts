
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  return callUserService(
    '/blocks',
    { method: 'GET', userId: user.id },
  )
})