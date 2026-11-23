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

    <div>
      <button :disabled="page <= 1" @click="goToPage(page - 1)">Previous</button>
      <span>Page {{ page }} of {{ totalPages }} ({{ total }} users)</span>
      <button :disabled="page >= totalPages" @click="goToPage(page + 1)">Next</button>
    </div>

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
import { ref, computed, onMounted } from 'vue'
import type { User, UserPage } from '#shared/types/user'

// Show users in a paginated list for admin management
const DEFAULT_PAGE_SIZE = 10
const MAX_PAGE_SIZE = 100

const route = useRoute()
const router = useRouter()

// Falls back to the default for missing, non-integer, or out-of-range values
const parseQueryInt = (raw: unknown, fallback: number, max = Infinity) => {
  const value = Number(Array.isArray(raw) ? raw[0] : raw)
  return Number.isInteger(value) && value >= 1 && value <= max ? value : fallback
}

const page = ref(parseQueryInt(route.query.page, 1))
const pageSize = ref(parseQueryInt(route.query.pageSize, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE))
const users = ref<User[]>([])
const total = ref(0)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

const loadUsers = async () => {
  const response = await $fetch<UserPage>('/api/admin/users', {
    method: 'GET',
    query: { page: page.value, pageSize: pageSize.value },
  })
  // The current page can become empty after a delete; step back to the last page
  if (response.items.length === 0 && page.value > 1) {
    page.value = Math.max(1, Math.ceil(response.total / pageSize.value))
    return loadUsers()
  }
  users.value = response.items
  total.value = response.total
  // Reflect the current state in the URL so reloads and shared links keep the page
  router.replace({ query: { page: page.value, pageSize: pageSize.value } })
}

const goToPage = async (target: number) => {
  if (target < 1 || target > totalPages.value) {
    return
  }
  page.value = target
  await loadUsers()
}

// Load users when the component is mounted
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