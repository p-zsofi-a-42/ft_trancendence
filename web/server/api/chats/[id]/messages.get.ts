import type { ChatMessage } from '#shared/types/chats'

// GET /api/chats/:id/messages?before=&limit=: one page of history, newest first.
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const id = getRouterParam(event, 'id') ?? ''
  // Forward only the two known query params. Missing or repeated values are skipped.
  const { before, limit } = getQuery(event)
  const params = new URLSearchParams()
  if (typeof before === 'string') params.set('before', before)
  if (typeof limit === 'string') params.set('limit', limit)
  const query = params.size > 0 ? `?${params}` : ''
  return callUserService<ChatMessage[]>(
    `/chats/${encodeURIComponent(id)}/messages${query}`,
    { method: 'GET', userId: user.id },
  )
})