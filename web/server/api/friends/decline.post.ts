import type { FriendshipResult } from '#shared/types/friends'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const { id } = await readBody(event)
  return callUserService<FriendshipResult>('/friends/decline', { body: { id }, userId: user.id })
})