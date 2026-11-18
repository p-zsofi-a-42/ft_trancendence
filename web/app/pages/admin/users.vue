<template>
  <div>
    <h1>Admin Users</h1>
	<!-- Button to load users -->
    <button @click="loadUsers">Load Users</button>
    <!-- User list will be rendered here -->
    <ul>
      <li v-for="user in users" :key="user.id">
        {{ user.name }} ({{ user.email }}) - Role: {{ user.role }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { User } from '#shared/types/user'
	
const users = ref<User[]>([])

const loadUsers = async () => {
  // GET request to fetch the list of users as an admin
  const response = await $fetch<User[]>('/api/admin/users', {
    method: 'GET'
  })
  users.value = response
}

onMounted(loadUsers)

</script>