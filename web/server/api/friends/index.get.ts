import type { FriendEntry } from '#shared/types/friends'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  return callUserService<FriendEntry[]>(
    '/friends',
    { method: 'GET', userId: user.id },
  )
})
