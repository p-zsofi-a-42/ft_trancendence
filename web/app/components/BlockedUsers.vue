<template>
  <div>
    <h2>Blocked Users</h2>
    <!-- display blocked users -->
    <ul>
      <li v-for="user in blockedUsers" :key="user.id">{{ user.name }}
        <button @click="unblockUser(user.id)">Unblock</button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
//
import type { BlockedUser } from '#shared/types/friends'

// Fetch blocked users from the API
const {data, error, refresh } = useFetch<BlockedUser[]>('/api/blocks', { method: 'GET' })

// Compute the list of blocked users, defaulting to an empty array if no data is available
const blockedUsers = computed(() => data.value ?? [])

// function to unblock a user
const unblockUser = async (userId: string) => {
  try {
    await $fetch(`/api/blocks/unblock`, { method: 'POST', body: { id: userId } })
    await refresh()
  } catch (err: any) {
    alert('Failed to unblock user: ' + err.message)
  }
}

</script>