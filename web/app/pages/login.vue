<template>
  <div>
    <h1>Login</h1>

    <!-- Step 1: email + password -->
    <form v-if="!totpPending" @submit.prevent="login">
      <label>
        Email:
        <input type="email" v-model="email" required />
      </label>
      <br />
      <label>
        Password:
        <input type="password" v-model="password" required />
      </label>
      <br />
      <button type="submit" :disabled="loading">Login</button>
      <p v-if="error" role="alert">{{ error }}</p>
    </form>

    <!-- Step 2: TOTP code (or recovery code) -->
    <form v-else @submit.prevent="submitTotp">
      <p>Enter the 6-digit code from your authenticator app.</p>
      <label>
        <template v-if="!useRecovery">Code:</template>
        <template v-else>Recovery code:</template>
        <input
          type="text"
          v-model="code"
          autocomplete="one-time-code"
          required
          autofocus
        />
      </label>
      <br />
      <button type="submit" :disabled="loading">Verify</button>
      <button type="button" @click="useRecovery = !useRecovery">
        {{ useRecovery ? 'Use authenticator code instead' : 'Use a recovery code instead' }}
      </button>
      <p v-if="error" role="alert">{{ error }}</p>
    </form>

    <br />
    <NuxtLink to="/register">Don't have an account? Register here.</NuxtLink>
  </div>
</template>


<!-- Logic for handling login and TOTP verification forms -->
<script setup lang="ts">
const email = ref('')
const password = ref('')
const code = ref('')
const loading = ref(false)
const error = ref('')
const totpPending = ref(false)
const useRecovery = ref(false)

async function login() {
  error.value = ''
  loading.value = true
  try {
    const result = await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email: email.value, password: password.value },
    })
    if ('totpRequired' in result && result.totpRequired) {
      totpPending.value = true
      return
    }
    await useUserSession().fetch()
    await navigateTo('/profile')
  } catch (err) {
    error.value = (err as { data?: { message?: string } }).data?.message ?? 'Login failed'
  } finally {
    loading.value = false
  }
}

// Handles submission of the TOTP or recovery code form.
async function submitTotp() {
  error.value = ''
  loading.value = true
  try {
    const endpoint = useRecovery.value ? '/api/auth/totp/recovery' : '/api/auth/totp/verify'
    await $fetch(endpoint, { method: 'POST', body: { code: code.value } })
    await useUserSession().fetch()
    await navigateTo('/profile')
  } catch (err) {
    error.value = (err as { data?: { message?: string } }).data?.message ?? 'Invalid code'
  } finally {
    loading.value = false
  }
}
</script>
