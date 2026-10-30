<!-- Chat page for a specific conversation identified by 
 its ID in the URL path -->
<!-- [id] => conversation ID (id of row in conversations table) -->
<template>
  <main>
    <NuxtLink to="/chats">
      Back
    </NuxtLink>
    <ChatList />
    <h1 v-if="friendName">Chat {{ friendName }}</h1>
    <p v-if="!friendName">
      Friend not found.
    </p>
    <!-- Chat messages list -->
    <p v-if="loadError">
      {{ loadError }}
    </p>
    <!-- Error message for loading chat messages -->
    <template v-else>
      <ul>
        <li v-for="message in messages" :key="message.id">
          <!-- Background color change based on sender -->
          <div :class="message.sender_id === user?.id ? 'message-mine' : 'message-theirs'">
          <ClientOnly>
            <time :datetime="message.created_at">{{ new Date(message.created_at).toLocaleTimeString() }}</time><br>
            <template #fallback>
              <time :datetime="message.created_at"></time>
            </template>
          </ClientOnly>
          <!-- <strong>{{ message.sender_id === user?.id ? 'You' : 'Them' }}</strong> -->
            <p>{{ message.body }}</p>
          </div>
        </li>
      </ul>
      <!-- Message input form -->
      <form @submit.prevent="send">
        <input
          v-model="text"
          maxlength="2000"
          placeholder="Write a message"
          :disabled="sending"
        >
        <!-- Send Button -->
        <button type="submit" :disabled="sending || !text.trim()">
          Send
        </button>
        <p v-if="sendError">
          {{ sendError }}
        </p>
      </form>
    </template>
  </main>
</template>


<!-- ---------------------------------- -->
<!-- Script section for chat page logic -->
<script setup lang="ts">
import type { ChatMessage, ConversationEntry } from '#shared/types/chats'
// Login check and redirect if not logged in
const route = useRoute()
const conversationId = computed(() => String(route.params.id))
const { loggedIn, user } = useUserSession()

if (!loggedIn.value) {
  await navigateTo('/login')
}

// The API returns newest first. The UI shows oldest first, so the list is
// reversed.
const { data, error } = await useFetch<ChatMessage[]>(
  () => `/api/chats/${conversationId.value}/messages`,
  { key: computed(() => `chat-${conversationId.value}`), default: () => [] },
)

const messages = computed(() => [...(data.value ?? [])].reverse())
await markAsRead()
// fetch a ticket and open socket, pushing incoming messages -> data.value
// and close it onBeforeUnmount.
///////////////////////////////////////
// WEBSOCKET LOGIC ////////////////////
// Opens a live WebSocket connection for this conversation so messages sent by
// the other participant appear without a manual refresh. Client-only: everything
// above runs during SSR too, where WebSocket doesn't exist.
let socket: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let closedByUs = false

async function connectChatSocket() {
  // Fresh ticket on every (re)connect - it's short-lived by design, never cache it.
  const { ticket } = await $fetch<{ ticket: string }>(
    `/api/chats/${conversationId.value}/ws-ticket`,
    { method: 'POST' },
  )
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
  // Connect to the WebSocket server with the ticket
  socket = new WebSocket(`${protocol}//${location.host}/ws/chat?ticket=${ticket}`)

  // Handle incoming messages from the WebSocket server
  socket.onmessage = (event) => {
    const payload = JSON.parse(event.data)
    if (payload.type !== 'message') return
    // send() already added our own message optimistically; the fan-out has no
    // notion of "skip the sender", so dedupe by id.
    const exists = data.value?.some(m => m.id === payload.message.id)
    if (!exists) {
      data.value = [payload.message, ...(data.value ?? [])]
      markAsRead()
    }
  }

  socket.onclose = () => {
    if (closedByUs) return
    reconnectTimer = setTimeout(connectChatSocket, 2000)
  }
}

onMounted(connectChatSocket)

// Reconnect when navigating between conversations without this component
// being destroyed.
watch(conversationId, () => {
  closedByUs = true
  socket?.close()
  closedByUs = false
  connectChatSocket()
})

onBeforeUnmount(() => {
  closedByUs = true
  if (reconnectTimer) clearTimeout(reconnectTimer)
  socket?.close()
})

///////////////////////////////////////
///////////////////////////////////////
const text = ref('')
const sending = ref(false)
const sendError = ref('')

// Keeps the client_id of an unfinished send, so a retry of the same text is 
// stored only once.
let attempt: { text: string, clientId: string } | null = null

function errorMessage(err: unknown): string {
  const status = (err as { statusCode?: number }).statusCode
  if (status === 403) return 'You cannot message this user. You must be friends and not blocked.'
  if (status === 404) return 'This conversation does not exist.'
  if (status === 400) return 'The message must be between 1 and 2000 characters.'
  return 'The message could not be sent. Please try again.'
}

const loadError = computed(() => (error.value ? errorMessage(error.value) : ''))
// Sends a new chat message
async function send() {
  const body = text.value.trim()
  if (!body || sending.value) return

  // crypto.randomUUID() needs a secure context. Works on localhost, not plain HTTP
  // over LAN IP.
  if (!attempt || attempt.text !== body) {
    attempt = { text: body, clientId: crypto.randomUUID() }
  }

  sending.value = true
  sendError.value = ''
  try {
    const message = await $fetch<ChatMessage>(`/api/chats/${conversationId.value}/messages`, {
      method: 'POST',
      body: { body, client_id: attempt.clientId },
    })
    data.value = [message, ...(data.value ?? [])]
    text.value = ''
    attempt = null
    console.log('User Id:', user.value?.id)
  }
  catch (err) {
    if ((err as { statusCode?: number }).statusCode === 401) {
      await navigateTo('/login')
      return
    }
    sendError.value = errorMessage(err)
  }
  finally {
    await markAsRead()
    sending.value = false
  }
}

// GET FRIENDS USER NAME
// Fetches all conversations to find the friend's name for the current chat.
const { data: conversations } = await useFetch<ConversationEntry[]>(
  '/api/chats/all',
  { key: 'chats-all', default: () => [] },
)
// Finds the friend's name for the current conversation.
const friendName = computed(() =>
  conversations.value.find(c => c.id === conversationId.value)?.friend_name ?? '',
)

// Marks the conversation as read up to the newest message. Failures are ignored,
// since a missed read only leaves the unread badge up for longer.
async function markAsRead() {
  const newest = data.value?.[0]
  if (!newest) return
  try {
    await $fetch(`/api/chats/${conversationId.value}/read`, {
      method: 'POST',
      body: { last_message_id: newest.id },
    })
  }
  catch {
    // Ignored on purpose, see above
  }
}
</script>

<!-- Styles for chat message backgrounds based on sender -->
<style scoped>
.message-mine {
  background-color: lightskyblue; /* light blue, for messages sent by the logged-in user */
}

.message-theirs {
  background-color: lightgray; /* light gray, for messages sent by the other person */
}
</style>
