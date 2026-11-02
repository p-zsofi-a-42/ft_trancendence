// API to block a user
// Expects a JSON body with the ID of the user to block
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const { id } = await readBody(event)
  return callUserService<FriendshipResult>('/blocks/block', { body: { id }, userId: user.id })
})