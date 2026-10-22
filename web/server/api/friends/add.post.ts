import type { FriendshipResult } from '#shared/types/friends'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const body = await readBody(event)
  return callUserService<FriendshipResult>('/friends/add', { body, userId: user.id })
})
