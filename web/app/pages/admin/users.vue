<template>
  <div>
    <!-- FILTERS -->
    <UCard class="text-default">
      <template #header>
        <h2 class="font-semibold">Filters</h2>
      </template>
      <UForm class="grid grid-cols-1 gap-3 md:grid-cols-3" @submit.prevent="applyFilters">
        <UInput v-model="filters.q" placeholder="Search by name" maxlength="100" />
        <UInput v-model="filters.createdFrom" type="date" />
        <UInput v-model="filters.createdTo" type="date" />
        <!-- role, 2FA, sort and order selects go here -->
        <USelect v-model="filters.role" :items="roleItems" placeholder="Select role" />
        <USelect v-model="filters.totpEnabled" :items="twoFactorItems" placeholder="Select 2FA status" />
        <USelect v-model="filters.sort" placeholder="Select sort field" :items="sortByItems" />
        <USelect v-model="filters.order" placeholder="Select order" :items="orderItems" />
        <div class="flex justify-end gap-2 md:col-span-3">
          <UButton type="button" variant="outline" @click="resetFilters">Reset</UButton>
          <UButton type="submit">Search</UButton>
        </div>
      </UForm>
    </UCard>

    <p v-if="errorMessage">{{ errorMessage }}</p><br />

    <!-- USERS -->
    <div>
      <UTable
        :data="users"
        :columns="columns"
        empty="No users found"
        class="border border-default rounded-lg overflow-hidden"
        :ui="{
          thead: 'bg-elevated',
          th: 'text-highlighted font-semibold',
          td: 'text-black',
        }">
        <template #actions-cell="{ row }">
          <UButton type="button" color="primary" @click="viewUser(row.original.id)">View</UButton>
          <UButton type="button" color="error" @click="confirmDeleteUser(row.original.id)">Delete</UButton>
        </template>
      </UTable>
    </div>

    <!-- PAGINATION -->
    <div class="flex flex-wrap items-center justify-between gap-4 py-4">
      <div class="flex items-center gap-2">
        <UButton :disabled="page <= 1" @click="goToPage(page - 1)">Previous</UButton>
        <span class="text-sm text-muted">Page {{ page }} of {{ totalPages }} · {{ total }} users</span>
        <UButton :disabled="page >= totalPages" @click="goToPage(page + 1)">Next</UButton>
      </div>
      <label class="flex items-center gap-2 text-sm">
        Per page
        <select class="rounded-md border border-default bg-default px-2 py-1 text-default" :value="pageSize" @change="onPageSizeChange">
          <option v-for="size in PAGE_SIZE_OPTIONS" :key="size" :value="size">{{ size }}</option>
        </select>
      </label>
    </div>

    <!-- EDIT USER -->
    <UModal v-model:open="editOpen" title="Edit user">
      <template #body>
        <UForm :state="editForm" class="grid gap-3" @submit.prevent="saveUser">
          <UFormField label="Name">
            <UInput v-model="editForm.name" class="w-full" />
          </UFormField>
          <UFormField label="Email">
            <UInput v-model="editForm.email" type="email" class="w-full" />
          </UFormField>
          <UFormField label="Role">
            <USelect v-model="editForm.role" :items="editRoleItems" class="w-full" />
          </UFormField>
          <p v-if="editError" class="text-error">{{ editError }}</p>
        </UForm>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton variant="outline" @click="editOpen = false">Cancel</UButton>
          <UButton @click="saveUser">Save</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import type { User, UserPage } from '#shared/types/user'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({ middleware: 'admin' })

const ANY = 'all'
const roleItems = [
  { label: 'Any role', value: ANY },
  { label: 'User', value: 'user' },
  { label: 'Admin', value: 'admin' },
]
const twoFactorItems = [
  { label: 'Any 2FA status', value: ANY },
  { label: '2FA on', value: 'true' },
  { label: '2FA off', value: 'false' },
]

const sortByItems = [
  { label: 'ID', value: 'id' },
  { label: 'Name', value: 'name' },
  { label: 'Email', value: 'email' },
  { label: 'Role', value: 'role' },
  { label: 'Created', value: 'createdAt' },
]
const orderItems = [
  { label: 'Ascending', value: 'asc' },
  { label: 'Descending', value: 'desc' },
]

const columns: TableColumn<User>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'role', header: 'Role' },
  {
    accessorKey: 'totpEnabled',
    header: '2FA',
    cell: ({ row }) => (row.original.totpEnabled ? 'On' : 'Off'),
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => new Date(row.original.createdAt ?? '').toLocaleDateString(),
  },
  { id: 'actions', header: 'Actions' },
]

const DEFAULT_PAGE_SIZE = 10
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

const route = useRoute()
const router = useRouter()

const parseQueryInt = (raw: unknown, fallback: number) => {
  const value = Number(Array.isArray(raw) ? raw[0] : raw)
  return Number.isInteger(value) && value >= 1 ? value : fallback
}

const queryString = (key: string, fallback = '') => {
  const raw = route.query[key]
  return typeof raw === 'string' ? raw : fallback
}

const page = ref(parseQueryInt(route.query.page, 1))
const requestedPageSize = parseQueryInt(route.query.pageSize, DEFAULT_PAGE_SIZE)
const pageSize = ref(PAGE_SIZE_OPTIONS.includes(requestedPageSize) ? requestedPageSize : DEFAULT_PAGE_SIZE)
const filters = reactive({
  q: queryString('q'),
  role: queryString('role', ANY),
  totpEnabled: queryString('totpEnabled', ANY),
  createdFrom: queryString('createdFrom'),
  createdTo: queryString('createdTo'),
  sort: queryString('sort', 'id'),
  order: queryString('order', 'asc'),
})
const users = ref<User[]>([])
const total = ref(0)
const errorMessage = ref('')
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

// Empty filters are left out so the URL and request stay short
const buildQuery = () => {
  const params: Record<string, string | number> = { page: page.value, pageSize: pageSize.value }
  for (const [key, value] of Object.entries(filters)) {
    if (value !== '' && value !== ANY)
      params[key] = value
  }
  return params
}

const loadUsers = async () => {
  try {
    const response = await $fetch<UserPage>('/api/admin/users', {
      method: 'GET',
      query: buildQuery(),
    })
    // The current page can become empty after a delete; step back to the last page
    if (response.items.length === 0 && page.value > 1) {
      page.value = Math.max(1, Math.ceil(response.total / pageSize.value))
      return loadUsers()
    }
    users.value = response.items
    total.value = response.total
    errorMessage.value = ''
    router.replace({ query: buildQuery() })
  } catch (error) {
    errorMessage.value = 'Could not load users. Check the filters and try again.'
  }
}

const applyFilters = async () => {
  page.value = 1
  await loadUsers()
}

const resetFilters = async () => {
  Object.assign(filters, { q: '', role: ANY, totpEnabled: ANY, createdFrom: '', createdTo: '', sort: 'id', order: 'asc' })
  page.value = 1
  await loadUsers()
}

const goToPage = async (target: number) => {
  if (target < 1 || target > totalPages.value) {
    return
  }
  page.value = target
  await loadUsers()
}

const onPageSizeChange = async (event: Event) => {
  pageSize.value = Number((event.target as HTMLSelectElement).value)
  page.value = 1
  await loadUsers()
}

onMounted(loadUsers)

// ...deleteUser, userToEdit, updateUser, viewUser unchanged...

const confirmDeleteUser = async (userId: string) => {
  if (confirm('Are you sure you want to delete this user?')) {
    await deleteUser(userId)
  }
}
const deleteUser = async (userId: string) => {
  try {
    await $fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE',
    })
    await loadUsers()
  } catch (error) {
    errorMessage.value = 'Could not delete user.'
  }
}


const editOpen = ref(false)
const editingId = ref<string | null>(null)
const editForm = reactive({ name: '', email: '', role: 'user' })
const editError = ref('')
const editRoleItems = [
  { label: 'User', value: 'user' },
  { label: 'Admin', value: 'admin' },
]

// Copy the user into a local form so Cancel discards edits
const viewUser = async (id: string) => {
  try {
    const user = await $fetch<User>(`/api/admin/users/${id}`)
    editingId.value = id
    Object.assign(editForm, { name: user.name, email: user.email ?? '', role: user.role })
    editError.value = ''
    editOpen.value = true
  } catch (error) {
    errorMessage.value = 'Could not load user.'
  }
}

const saveUser = async () => {
  if (!editingId.value) return
  try {
    await $fetch(`/api/admin/users/${editingId.value}`, {
      method: 'PATCH',
      body: { name: editForm.name, email: editForm.email, role: editForm.role },
    })
    editOpen.value = false
    await loadUsers()
  } catch (error) {
    editError.value = 'Could not save changes. Check the values and try again.'
  }
}

</script>