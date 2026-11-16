<script setup lang="ts">

const route = useRoute()
const gameCode = computed(() => route.params.code)

const { loggedIn, user } = useUserSession()
if (!loggedIn.value) {
  navigateTo('/login')
}

///////////////////////////////////////
// WEBSOCKET LOGIC ////////////////////
let socket: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let closedByUs = false

async function connectWebSocket() {
  // Fresh Ticket on every connection attempt
  const ticket = await $fetch<{ ticket: string }>(
    `/api/game/${gameCode.value}/ws-ticket`,
    { method: 'POST' }
  )
  console.log('Obtained WebSocket ticket:', ticket.ticket)
  // Connect to WebSocket with the obtained ticket
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
  socket = new WebSocket(`${protocol}//${location.host}/ws/game?ticket=${ticket.ticket}`)

  // Handle incoming events from the Websocket
  socket.onmessage = (event) => {
    const payloadEvent = JSON.parse(event.data)
    if (payloadEvent.type !== 'join') // possible other event types?
      return
    console.log('Event received:', payloadEvent.type)
  }

  // Handle WebSocket close event
  socket.onclose = () => {
    if (closedByUs)
      return
    reconnectTimer = setTimeout(connectWebSocket, 2000)
  }
}
// Connect WebSocket on component mount
onMounted(connectWebSocket)
// Disconnect WebSocket on component unmount
onBeforeUnmount(() => {
  closedByUs = true
  if (reconnectTimer) clearTimeout(reconnectTimer)
  socket?.close()
})
</script>

<template>
<h1>Foyer - {{ gameCode }}</h1>

</template>