// Composable for managing user presence via WebSocket connection
type PresenceMessage =
  | { type: 'snapshot', online: string[] }
  | { type: 'presence', userId: string, online: boolean }

const PING_MS = 30_000
const SNAPSHOT_MS = 60_000
const MAX_BACKOFF_MS = 30_000

// Tracks online presence of users and manages WebSocket connection with 
// automatic reconnection and backoff.
export function usePresence() {
  const onlineIds = useState<string[]>('presence:online', () => [])

  let socket: WebSocket | null = null
  let pingTimer: ReturnType<typeof setInterval> | null = null
  let snapshotTimer: ReturnType<typeof setInterval> | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let backoff = 1000
  let running = false

  function clearTimers() {
    if (pingTimer)
      clearInterval(pingTimer)
    if (snapshotTimer)
      clearInterval(snapshotTimer)
    if (reconnectTimer)
      clearTimeout(reconnectTimer)
    pingTimer = snapshotTimer = reconnectTimer = null
  }

  function send(msg: object) {
    if (socket?.readyState === WebSocket.OPEN)
      socket.send(JSON.stringify(msg))
  }

  function handle(raw: string) {
    const msg = JSON.parse(raw) as PresenceMessage
    if (msg.type === 'snapshot') {
      onlineIds.value = msg.online
    } else {
      const others = onlineIds.value.filter(id => id !== msg.userId)
      onlineIds.value = msg.online ? [...others, msg.userId] : others
    }
  }

  function scheduleReconnect() {
    if (!running)
      return
    reconnectTimer = setTimeout(connect, backoff)
    backoff = Math.min(backoff * 2, MAX_BACKOFF_MS)
  }

  let generation = 0

  // connect: establishes a WebSocket connection to the presence server using a 
  // ticket, sets up event handlers, and manages reconnection logic.
  async function connect() {
    const gen = generation
    try {
      const { ticket } = await $fetch<{ ticket: string }>('/api/presence/ws-ticket', { method: 'POST' })
      if (!running || gen !== generation)
        return
      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
      const ws = new WebSocket(`${protocol}//${location.host}/ws/presence?ticket=${ticket}`)
      socket = ws

      ws.onopen = () => {
        backoff = 1000
        pingTimer = setInterval(() => send({ type: 'ping' }), PING_MS)
        snapshotTimer = setInterval(() => send({ type: 'snapshot' }), SNAPSHOT_MS)
      }
      ws.onmessage = e => {
        if (ws === socket)
          handle(e.data)
      }
      ws.onclose = () => {
        if (ws !== socket) return
        clearTimers()
        onlineIds.value = []
        scheduleReconnect()
      }
    } catch {
      scheduleReconnect()
    }
  }

  function start() {
    if (!import.meta.client || running)
      return
    generation++
    running = true
    connect()
  }

  function stop() {
    running = false
    clearTimers()
    const ws = socket
    generation++
    socket = null
    ws?.close()
    onlineIds.value = []
  }

  return { onlineIds, start, stop }
}