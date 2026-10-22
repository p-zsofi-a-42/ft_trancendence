import type { FriendshipResult } from '#shared/types/friends'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const { id } = await readBody(event)
  
  // Here you would implement the logic to remove the friend with the given ID
  // For now, let's just return a success response
  
  return callUserService<FriendshipResult>(
    '/friends/remove', 
    { body: { id }, 
      userId: user.id }
  )
})