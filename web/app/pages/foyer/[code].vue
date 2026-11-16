<template>
  <div class="max-w-md mx-auto mt-16 p-6">
    <h1 class="text-2xl font-bold mb-2">Join Game</h1>
    <p class="text-sm text-gray-500 mb-6">
      Game Code: <span class="font-mono font-semibold text-black">{{ gameCode }}</span>
    </p>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label for="companyName" class="block text-sm font-medium mb-1">
          Company Name
        </label>
        <input
          id="companyName"
          v-model="companyName"
          type="text"
          required
          placeholder="Enter your company name"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-black"
        />
      </div>

      <p v-if="errorMessage" class="text-red-600 text-sm">
        {{ errorMessage }}
      </p>
			<div v-if="!message" class="text-gray-400 text-sm animate-pulse">
				Warte auf Echtzeit-Daten via WebSocket...
			</div>

			<!-- Sobald Daten da sind, werden sie automatisch angezeigt -->
			<div v-else class="space-y-2">
				<p>Spielname: <span class="font-bold">{{ message.msg }}</span></p>
			</div>

      <button
        type="submit"
        :disabled="isLoading"
        class="w-full py-2 px-4 bg-black text-white rounded-md hover:opacity-80 disabled:opacity-50 transition-opacity"
      >
        {{ isLoading ? 'Joining...' : 'Join Game' }}
      </button>
    </form>
		<form @submit.prevent="testWS">
      <button
        type="submit"
        :disabled="isLoading"
        class="w-full py-2 px-4 bg-black text-white rounded-md hover:opacity-80 disabled:opacity-50 transition-opacity"
      >
				testing
      </button>
		</form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const route = useRoute()
const router = useRouter()

// Den dynamischen Parameter [code] aus der URL auslesen
const gameCode = route.params.code

const companyName = ref('')
const isLoading = ref(false)
const errorMessage = ref(null)

const toast = useToast();
let message = ref(null);

let socket: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let closedByUs = false

async function connectWebSocket() {
  // Fresh Ticket on every connection attempt
  const ticket = await $fetch<{ ticket: string }>(
    `/api/foyer/${gameCode}/ws-ticket`,
    { method: 'POST' }
  )
  console.log('Obtained WebSocket ticket:', ticket.ticket)
  // Connect to WebSocket with the obtained ticket
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
  socket = new WebSocket(`${protocol}//${location.host}/ws/game?ticket=${ticket.ticket}`)

  // Handle incoming events from the Websocket
  socket.onmessage = (event) => {
    const payloadEvent = JSON.parse(event.data)
		message.value = payloadEvent;
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

const testWS = async () => {
	try {
		// Beispiel-Request an deinen Backend-Endpunkt
		const response = await $fetch("/api/company/test", {
			method: 'POST',
			body: {gameCode: gameCode}
		})

		// Bei Erfolg weiterleiten (z. B. ins eigentliche Spiel oder Dashboard)
		// router.push(`/game/${gameCode}`)
		console.log('Successfully joined:', response)
  } catch (error) {
		console.log(`error: ${error.message}`)
		toast.add({
			title: "Failure",
			description: "Failed to create a new Foyer.",
			color: "danger",
		});
  } 
}

const handleSubmit = async () => {
  isLoading.value = true
  errorMessage.value = null

  try {
    // Beispiel-Request an deinen Backend-Endpunkt
    const response = await $fetch("/api/company/create", {
      method: 'POST',
      body: {
        name: companyName.value,
				gameCode: gameCode
      }
    })

		socket.
    // Bei Erfolg weiterleiten (z. B. ins eigentliche Spiel oder Dashboard)
    // router.push(`/game/${gameCode}`)
    console.log('Successfully joined:', response)
  } catch (error) {
		console.log(`error: ${error.message}`)
		toast.add({
			title: "Failure",
			description: "Failed to create a new Foyer.",
			color: "danger",
		});
  } finally {
    isLoading.value = false
  }
}
</script>
