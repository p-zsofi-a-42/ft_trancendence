// WebSocket handler for chat conversations, managing peer connections and Redis pub/sub.
import { createClient } from 'redis'
import { verifyWsTicket } from '../../utils/wsTicket'

const sub = createClient({ url: useRuntimeConfig().redisUrl }) // Redis client for subscribing to chat messages
const subReady = sub.connect()
const peersByConversation = new Map<string, Set<any>>() // Maps conversation IDs to sets of connected peers

// Adds a peer to a conversation, subscribing to Redis messages if necessary.
async function addPeer(conversationId: string, peer: any) {
  await subReady
  let peers = peersByConversation.get(conversationId)
  if (!peers) {
    peers = new Set()
    peersByConversation.set(conversationId, peers)
    await sub.subscribe(`chat:conv:${conversationId}`, (raw) => {
      for (const p of peersByConversation.get(conversationId) ?? []) p.send(raw)
    })
  }
  peers.add(peer)
}
// Removes a peer from a conversation, unsubscribing from Redis if no peers remain.
async function removePeer(conversationId: string, peer: any) {
  await subReady
  const peers = peersByConversation.get(conversationId)
  if (!peers) return
  peers.delete(peer)
  if (peers.size === 0) {
    peersByConversation.delete(conversationId)
    await sub.unsubscribe(`chat:conv:${conversationId}`)
  }
}

// WebSocket handler for chat conversations, handling upgrade, open, and close events.
// A peer represents a connected WebSocket client participating in a conversation.
// Example: chat open in two tabs (same user) => two peers in the same conversation set.
export default defineWebSocketHandler({
  // Handles the WebSocket upgrade request, verifying the ticket and setting context. (user ID and conversation ID)
  async upgrade(request) {
    const ticket = new URL(request.url).searchParams.get('ticket')
    if (!ticket) return new Response('Missing ticket', { status: 401 })
    try {
      const claims = await verifyWsTicket(ticket)
      if (claims.scope !== 'chat')
        return new Response('Forbidden', { status: 403 })
      request.context.userId = claims.sub
      request.context.conversationId = claims.resourceId
      // return { context: { userId: claims.sub, conversationId: claims.resourceId } }
    } catch {
      return new Response('Invalid ticket', { status: 401 })
    }
  },
  // Handles the WebSocket open event, adding the peer to the conversation's peer set.
  async open(peer) {
    const { conversationId } = peer.context as { conversationId: string }
    await addPeer(conversationId, peer)
  },
  // Handles the WebSocket close event, removing the peer from the conversation's peer set.
  async close(peer) {
    const { conversationId } = peer.context as { conversationId: string }
    await removePeer(conversationId, peer)
  },
})