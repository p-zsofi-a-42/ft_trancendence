<template>
  <div>
    <h1>Admin Users</h1>
	<!-- Button to load users -->
    <button @click="loadUsers">Load Users</button>
    <!-- User list will be rendered here -->
    <ul>
      <li v-for="user in users" :key="user.id">
        {{ user.name }} ({{ user.email }}) - Role: {{ user.role }}
        <button @click="deleteUser(user.id)">Delete</button>
        <button @click="viewUser(user.id)">View</button>
      </li>
    </ul>
    <div v-if="userToEdit">
      <h2>Edit User</h2>
      <form @submit.prevent="updateUser(userToEdit.id)">
        <label>
          Name:
          <input v-model="userToEdit.name" />
        </label>
        <label>
          Email:
          <input v-model="userToEdit.email" />
        </label>
        <label>
          Role:
          <input v-model="userToEdit.role" />
        </label>
        <button type="submit">Update</button>
      </form>
    </div>
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

const deleteUser = async (id: string) => {
  await $fetch(`/api/admin/users/${id}`, {
    method: 'DELETE'
  });
  // Reload the users after deletion
  await loadUsers();
}

const userToEdit = ref<User | null>(null)

const updateUser = async (id: string) => {
  if (!userToEdit.value) return;
  const { name, email, role } = userToEdit.value;
  const user = await $fetch(`/api/admin/users/${id}`, {
    method: 'PATCH',
    body: { name, email, role }
  });

  await loadUsers();
  userToEdit.value = null;
}
// after view user details, a form should be displayed to edit the user's information
const viewUser = async (id: string) => {
  const user = await $fetch<User>(`/api/admin/users/${id}`, {
    method: 'GET'
  });
  userToEdit.value = user;
}

</script>