<template>
  <div v-if="user">
    <UCard
      :ui="{
        root: 'text-white',
      }"
    >
      <template #header>
        <UUser
          :name="user.name"
          :avatar="{
            loading: 'lazy',
            icon: 'i-lucide-user',
          }"
          chip
          size="3xl"
        />
      </template>
      <p><strong>ID:</strong> {{ user.id }}</p>
      <p><strong>Name:</strong> {{ user.name }}</p>
      <p><strong>Email:</strong> {{ user.email }}</p>
  </UCard>
</div>
<!-- TEMP: for manual testing of the 2FA wizard, pending a dedicated settings page -->
<TwoFactAuth />
</template>

<script setup lang="ts">
// Fetch the current user's profile information and handle authentication redirect if not logged in
const { data: user, error } = await useFetch("/api/auth/profile");
if (error.value) {
  await navigateTo("/login");
}
</script>
