import type { ChatMessage } from '#shared/types/chats'

// POST /api/chats/:id/messages: body { body, client_id }. client_id makes retries safe.
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const id = getRouterParam(event, 'id') ?? ''
  const { body, client_id } = (await readBody(event)) ?? {}
  return callUserService<ChatMessage>(
    `/chats/${encodeURIComponent(id)}/messages`,
    { body: { body, client_id }, userId: user.id },
  )
})