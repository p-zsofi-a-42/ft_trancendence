import type { ConversationEntry } from '#shared/types/chats'

// GET /api/chats: the conversation list of the logged-in user.
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  return callUserService<ConversationEntry[]>('/chats', { method: 'GET', userId: user.id })
})