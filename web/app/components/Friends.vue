<!-- ACCEPTED FRIENDS COMPONENT -->
<template>
  <div>
    <h3>Accepted Friends</h3>
    <ul>
      <li v-for="friend in friends" :key="friend.id">
        {{ friend.name }}
      </li>
    </ul>
    <p v-if="!friends.length">No accepted friends.</p>
  </div>
</template>


<script setup lang="ts">
import type { FriendEntry } from '#shared/types/friends'
import { useFetch } from '#app'

const { data: friendsData } = useFetch<FriendEntry[]>('/api/friends/accepted', { key: 'accepted-friends', default: () => [] })
const friends = computed(() => friendsData.value ?? [])
</script>