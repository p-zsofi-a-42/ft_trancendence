import { verifyWsTicket } from '../../utils/wsTicket'
import { runPresence, getOnlineFriends, presenceChannel } from '../../utils/presence'
import { callUserService } from '../../utils/userService'
import type { FriendEntry } from '#shared/types/friends'
import { createClient } from 'redis'

// Redis subscriber for presence updates
const sub = createClient({ url: useRuntimeConfig().redisUrl })
// Connect the Redis subscriber
const subReady = sub.connect()

// Fetch the friend IDs
async function fetchFriendIds(userId: string) {
  const friends = await callUserService<FriendEntry[]>('/friends', { method: 'GET', userId: Number(userId) })
  return friends.filter(f => f.friendship === 'friends').map(f => f.id)
}

// Refcounted friend channels and prune timers
type Watch = { peers: Set<any>, ready: Promise<void> }
const watchers = new Map<string, Watch>()
const pruneTimers = new Map<string, ReturnType<typeof setInterval>>()

// adding a peer to watch a friend's presence
async function watchFriend(friendId: string, peer: any) {
  let w = watchers.get(friendId)
  if (!w) {
    const ready = subReady.then(() => sub.subscribe(presenceChannel(friendId), (raw) => {
      for (const p of watchers.get(friendId)?.peers ?? []) forward(p, friendId, raw)
    }))
    w = { peers: new Set(), ready }
    watchers.set(friendId, w)
    pruneTimers.set(friendId, setInterval(() => {
      runPresence(friendId, 'prune').catch(console.error)
    }, 30_000))
  }
  w.peers.add(peer)
  await w.ready
}

// removing a peer from watching a friend's presence
async function unwatchFriend(friendId: string, peer: any) {
  const w = watchers.get(friendId)
  if (!w) return
  w.peers.delete(peer)
  if (w.peers.size > 0) return
  watchers.delete(friendId)
  clearInterval(pruneTimers.get(friendId))
  pruneTimers.delete(friendId)
  await w.ready
  await sub.unsubscribe(presenceChannel(friendId))
}

// Per socket state, buffering and forwarding
const peerState = new Map<any, { userId: string, connId: string, friends: Set<string>, buffering: boolean, buffer: string[] }>()

function forward(peer: any, friendId: string, raw: string) {
  const st = peerState.get(peer)
  if (!st) return
  const msg = JSON.stringify({ type: 'presence', userId: friendId, ...JSON.parse(raw) })
  if (st.buffering) st.buffer.push(msg)
  else peer.send(msg)
}


// Sync subscriptions and send the snapshot
async function syncFriends(peer: any, next: string[]) {
  const st = peerState.get(peer)!
  const want = new Set(next)
  for (const id of want) {
    if (!st.friends.has(id)) {
      await watchFriend(id, peer)
      st.friends.add(id)
    }
  }
  // iterating over [...st.friends] to avoid modifying the set while iterating
  for (const id of [...st.friends]) {
    if (!want.has(id)) {
      await unwatchFriend(id, peer)
      st.friends.delete(id)
    }
  }
}

async function sendSnapshot(peer: any) {
  const st = peerState.get(peer)!
  st.buffering = true
  await syncFriends(peer, await fetchFriendIds(st.userId))
  await runPresence(st.userId, 'connect', st.connId)
  const online = await getOnlineFriends([...st.friends])
  peer.send(JSON.stringify({ type: 'snapshot', online }))
  for (const m of st.buffer) peer.send(m)
  st.buffer = []
  st.buffering = false
}

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
    peerState.set(peer, { userId, connId, friends: new Set(), buffering: false, buffer: [] })
    try {
      await sendSnapshot(peer)
    } catch (err) {
      console.error('Failed to send snapshot:', err)
      peer.close()
    }
  },
  async message(peer, message) {
    let data: { type?: string }
    try {
      data = JSON.parse(message.text())
    } catch {
      return
    }
    if (data.type === 'ping') {
      const { userId, connId } = peerState.get(peer)!
      await runPresence(userId, 'ping', connId)
    }
    if (data.type === 'snapshot') {
      try {
        await sendSnapshot(peer)
      } catch (err) {
        console.error('Failed to send snapshot:', err)
        peer.close()
      }
    }
  },
  async close(peer) {
    const st = peerState.get(peer)
    if (!st)
      return
    await runPresence(st.userId, 'disconnect', st.connId)
    await syncFriends(peer, [])
    peerState.delete(peer)
  },
})