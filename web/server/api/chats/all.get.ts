import type { AllChatsResult } from '#shared/types/chats'
/**
 * GET /api/chats/all
 * Returns a list of all chats for the authenticated user.
 */
export default defineEventHandler(async (event) => {
  // Logic to fetch all chats for the authenticated user goes here
  const { user } = await requireUserSession(event)
  return callUserService<AllChatsResult>(
    'chats/all', 
    { method: 'GET',
      userId: user.id 
    }
  )
})