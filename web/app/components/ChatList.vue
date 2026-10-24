<template>
  <div>
    <h2>Chats</h2>
    <!-- Chat list will be displayed here -->
    <ul v-if="chats && chats.conversations.length">
      <li v-for="conversation in chats.conversations" :key="conversation.id">
        {{ conversation.friend_name }} - {{ conversation.last_message_body }}
      </li>
    </ul>
    <p v-else>No chats available.</p>
  </div>
</template>

<script setup lang="ts">
// Chat list logic will go here
import type { AllChatsResult } from '#shared/types/chats'
import { ref, onMounted } from 'vue'

const chats = ref<AllChatsResult | null>(null)

onMounted(async () => {
  const response = await fetch('/api/chats/all')
  if (response.ok) {
    chats.value = await response.json()
  }
})
</script>