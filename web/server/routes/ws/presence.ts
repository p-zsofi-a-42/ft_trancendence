import { verifyWsTicket } from '../../utils/wsTicket'
import { runPresence, getOnlineFriends } from '../../utils/presence'

// WebSocket handler for user presence management
export default defineWebSocketHandler({
  async upgrade(request) {
    const ticket = new URL(request.url).searchParams.get('ticket')
    if (!ticket) return new Response('Missing ticket', { status: 401 })
    try {
      const claims = await verifyWsTicket(ticket)
      if (claims.scope !== 'presence')
        return new Response('Forbidden', { status: 403 })
      request.context.userId = claims.sub
      request.context.connId = crypto.randomUUID()
    } catch {
      return new Response('Invalid ticket', { status: 401 })
    }
  },
  async open(peer) {
    const { userId, connId } = peer.context as { userId: string, connId: string }
    await runPresence(userId, 'connect', connId)
    peer.send(JSON.stringify({ type: 'snapshot', online: [] }))
  },
  async message(peer, message) {
    const { userId, connId } = peer.context as { userId: string, connId: string }
    let data: { type?: string }
    try {
      data = JSON.parse(message.text())
    } catch {
      return
    }
    if (data.type === 'ping')
      await runPresence(userId, 'ping', connId)
  },
  async close(peer) {
    const { userId, connId } = peer.context as { userId: string, connId: string }
    await runPresence(userId, 'disconnect', connId)
  }
})