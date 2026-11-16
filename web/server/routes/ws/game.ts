import { createClient } from 'redis'
import { verifyWsTicket } from '../../utils/wsTicket'

// Redis client for subscribing to game-related channels
const sub = createClient({ url: useRuntimeConfig().redisUrl })

const subReady = sub.connect()

const peerBySession = new Map<string, Set<any>>()

// function to add a peer to a session
async function addPeerToSession(sessionId: string, peer: any) {
  await subReady
  let peers = peerBySession.get(sessionId)
  if (!peers) {
    peers = new Set()
    peerBySession.set(sessionId, peers)
    await sub.subscribe(`game:session:${sessionId}`, (raw) => {
      for (const p of peerBySession.get(sessionId) ?? []) p.send(raw)
    })
  }
  peers.add(peer)
}

// function to remove a peer from a session
async function removePeerFromSession(sessionId: string, peer: any) {
  await subReady
  const peers = peerBySession.get(sessionId)
  if (!peers)
    return
  peers.delete(peer)
  if (peers.size === 0) {
    peerBySession.delete(sessionId)
    await sub.unsubscribe(`game:session:${sessionId}`)
  }
}

// function to get all peers for a session
function getPeersForSession(sessionId: string) {
  return peerBySession.get(sessionId) || new Set()
}

// WebSocket handler for game sessions, handling upgrade, join, and leave events for peers
export default defineWebSocketHandler({
  async upgrade(request) {
    const ticket = new URL(request.url).searchParams.get('ticket')
    if (!ticket) return new Response('Missing ticket', { status: 401 })
    try {
      const claims = await verifyWsTicket(ticket)
      if (claims.scope !== 'game')
        return new Response('Forbidden', { status: 403 })
      request.context.userId = claims.sub
      request.context.sessionId = claims.resourceId
    } catch {
      return new Response('Invalid ticket', { status: 401 })
    }
  },
  async close(peer) {
    const { sessionId } = peer.context as { sessionId: string }
    await removePeerFromSession(sessionId, peer)
  },
  async open(peer) {
    const { sessionId } = peer.context as { sessionId: string }
    await addPeerToSession(sessionId, peer)
  }
})
