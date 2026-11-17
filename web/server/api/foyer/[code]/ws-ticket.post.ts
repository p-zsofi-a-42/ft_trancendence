import { signWsTicket } from "~~/server/utils/wsTicket"

// Returns a WebSocket ticket (JWT) for the current user to access the Game Session.
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const gameCode = getRouterParam(event, 'code') ?? ''
  return { ticket: await signWsTicket(user.id, 'game', gameCode) }
})
