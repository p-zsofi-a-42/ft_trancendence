<template>
  <div class="flex items-center justify-between gap-4">
    <div>
      <p class="font-medium">Two-factor authentication</p>
      <p class="text-sm text-muted">
        {{ enabled ? 'Enabled - an authenticator app is required at login.' : 'Add an extra step to login with an authenticator app.' }}
      </p>
    </div>

    <UButton
      v-if="!enabled"
      label="Enable"
      color="primary"
      :loading="loading"
      @click="showSetupModal = true"
    />
    <UButton
      v-else
      label="Disable"
      color="error"
      variant="soft"
      :loading="loading"
      @click="disable"
    />

    <!-- Walks through setup -> scan QR -> confirm code -> show recovery codes -->
    <TwoFactSetupModal
      v-model:open="showSetupModal"
      @enabled="enabled = true"
    />
  </div>
</template>

<script setup lang="ts">
// Reflects the account's current 2FA state.
const enabled = ref(false)
const loading = ref(false)
const showSetupModal = ref(false)

const { data: profile } = await useFetch('/api/auth/profile')
if (profile.value) {
  enabled.value = (profile.value as { totpEnabled?: boolean }).totpEnabled ?? false
}

async function disable() {
  loading.value = true
  try {
    await $fetch('/api/auth/totp/disable', { method: 'POST' })
    enabled.value = false
  } catch (err) {
    console.error('Failed to disable 2FA', err)
  } finally {
    loading.value = false
  }
}
</script>
