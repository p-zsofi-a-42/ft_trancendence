import type { ConversationResult } from '#shared/types/chats'

// POST /api/chats: body { id } of a friend. Creates the conversation or returns the existing one.
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const { id } = (await readBody(event)) ?? {}
  return callUserService<ConversationResult>('/chats', { body: { id }, userId: user.id })
})