/**
 * GET /api/chats/all
 * Returns a list of all chats for the authenticated user.
 */
export default defineEventHandler(async (event) => {
  const ownerId = await getServiceUserId(event)
  if (ownerId === null) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  // FETCH ALL CONVERSATIONS FOR THE AUTHENTICATED USER
  const conversations = await listConversations(ownerId)
  return conversations
})