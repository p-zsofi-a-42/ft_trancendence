import type { ReadResult } from '#shared/types/chats'

// POST /api/chats/:id/read: body { last_message_id } moves the read position forward.
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const id = getRouterParam(event, 'id') ?? ''
  const { last_message_id } = (await readBody(event)) ?? {}
  return callUserService<ReadResult>(
    `/chats/${encodeURIComponent(id)}/read`,
    { body: { last_message_id }, userId: user.id },
  )
})