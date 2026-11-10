<!-- ACCEPTED FRIENDS COMPONENT -->
<template>
  <UListbox 
    :items="friends" 
    label-key="name" 
    value-key="id" 
    class="w-full">
    <template #item-trailing="{ item }">
      <UButton size="sm" @click="inviteToGame(item.id)">Invite</UButton>
    </template>
  </UListbox>
  
  <!-- <div>
    <h3>Accepted Friends</h3>
    <ul>
      <li v-for="friend in friends" :key="friend.id">
        {{ friend.name }}
      </li>
    </ul>
    <p v-if="!friends.length">No accepted friends.</p>
  </div> -->
</template>


<script setup lang="ts">
import type { FriendEntry } from '#shared/types/friends'
const { data: friendsData } = useFetch<FriendEntry[]>('/api/friends/accepted', { key: 'accepted-friends', default: () => [] })
const friends = computed(() => friendsData.value ?? [])

// const selectedFriendId = ref<string | null>(null)
const body = "Join my game!"
const inviteToGame = async (itemId: string) => {
  console.log('Inviting friend: ' + itemId)

  try {
    await $fetch('/api/game/invite', {
      method: 'POST',
      body: { body, friendId: itemId }
    })
  } catch (error) {
    console.error('Failed to invite friend:', error)
  }
  console.log('Friend invited successfully')
}
</script>