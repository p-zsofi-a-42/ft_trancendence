<template>
  <div>
    <h2>ChatList</h2>
    <!-- Chat list will be displayed here -->
    <ul v-if="chats && chats.length">
      <li v-for="conversation in chats" :key="conversation.id">
        {{ conversation.friend_name }} - {{ conversation.last_message_body }}
      <NuxtLink :to="`/chats/${conversation.id}`">
        Open
      </NuxtLink>
      </li>
    </ul>
    <p v-else>No chats available.</p>
  </div>
</template>

<script setup lang="ts">
// Chat list logic will go here
import type { ConversationEntry } from '#shared/types/chats'
import { ref, onMounted } from 'vue'

const chats = ref<ConversationEntry[] | null>(null)

onMounted(async () => {
  const response = await fetch('/api/chats/all')
  if (response.ok) {
    chats.value = await response.json()
  }
})

</script>