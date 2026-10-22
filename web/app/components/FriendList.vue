<!-- Component to display the list of friends -->
<template>
  <div>
    <h2>Friends</h2>
    <p v-if="error">Could not load friends.</p>

    <h3>Friends</h3>
    <ul>
      <li v-for="friend in friends" :key="friend.id">
        {{ friend.name }}
      </li>
    </ul>
    <p v-if="!friends.length">No friends yet.</p>

    <h3>Incoming requests</h3>
    <ul>
      <li v-for="friend in incoming" :key="friend.id">
        {{ friend.name }}
        <button :disabled="accepting.has(friend.id)" @click="acceptRequest(friend.id)">
          Accept
        </button>
        <button :disabled="declining.has(friend.id)" @click="declineRequest(friend.id)">
          Decline
        </button>
      </li>
    </ul>
    <p v-if="!incoming.length">No incoming requests.</p>

    <h3>Sent requests</h3>
    <ul>
      <li v-for="friend in outgoing" :key="friend.id">
        {{ friend.name }}
      </li>
    </ul>
    <p v-if="!outgoing.length">No sent requests.</p>
  </div>
</template>


<script setup lang="ts">
import type { FriendEntry } from '#shared/types/friends'

const { data, error, refresh } = useFetch<FriendEntry[]>('/api/friends', { key: 'friends-list', default: () => [] })

const friends = computed(() => (data.value ?? []).filter(f => f.friendship === 'friends'))
const incoming = computed(() => (data.value ?? []).filter(f => f.friendship === 'incoming'))
const outgoing = computed(() => (data.value ?? []).filter(f => f.friendship === 'outgoing'))


// ACCEPT REQUESTS
const accepting = ref<Set<string>>(new Set()) // IDs of users whose request is being accepted
// Accepts a pending request from the given user, then reloads the list
const acceptRequest = async (id: string) => {
  accepting.value.add(id)
  try {
    await $fetch('/api/friends/accept', { method: 'POST', body: { id } })
    await refresh()
  } catch (err: any) {
    alert(err.statusCode === 404 ? 'No pending request from this user' : 'An unexpected error occurred')
  } finally {
    accepting.value.delete(id)
  }
}

// 
const declining = ref<Set<string>>(new Set()) // IDs of users whose request is being declined
// Declines a pending request from the given user, then reloads the list
const declineRequest = async (id: string) => {
  declining.value.add(id)
  try {
    await $fetch('/api/friends/decline', { method: 'POST', body: { id } })
    await refresh()
  } catch (err: any) {
    alert(err.statusCode === 404 ? 'No pending request from this user' : 'An unexpected error occurred')
  } finally {
    declining.value.delete(id)
  }
}
</script>