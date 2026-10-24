<!-- Chat page for a specific conversation identified by 
 its ID in the URL path -->
<!-- [id] => conversation ID (id of row in conversations table) -->
<template>
  <main>
    <NuxtLink to="/chats">
      Back
    </NuxtLink>
    <h1>Chat</h1>
    <!-- Chat messages list -->
    <p v-if="loadError">
      {{ loadError }}
    </p>
    <!-- Error message for loading chat messages -->
    <template v-else>
      <ul>
        <li v-for="message in messages" :key="message.id">
          <strong>{{ message.sender_id === user?.id ? 'You' : 'Them' }}</strong>
          <p>{{ message.body }}</p>
          <time :datetime="message.created_at">{{ new Date(message.created_at).toLocaleTimeString() }}</time>
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
import type { ChatMessage } from '#shared/types/chats'
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
  }
  catch (err) {
    if ((err as { statusCode?: number }).statusCode === 401) {
      await navigateTo('/login')
      return
    }
    sendError.value = errorMessage(err)
  }
  finally {
    sending.value = false
  }
}
</script>
