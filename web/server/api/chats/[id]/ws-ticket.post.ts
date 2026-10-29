import { signWsTicket } from "~~/server/utils/wsTicket"

// Returns a WebSocket ticket (JWT) for the current user to access the chat conversation.
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const conversationId = getRouterParam(event, 'id') ?? ''
  return { ticket: await signWsTicket(user.id, 'chat', conversationId) }
})