import { signWsTicket } from "~~/server/utils/wsTicket"

// Returns a WebSocket ticket (JWT) for the current user's presence connection.
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  return { ticket: await signWsTicket(user.id, 'presence', '') }
})