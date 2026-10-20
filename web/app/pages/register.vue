<template>
  <div>
    <h1>Register</h1>
    <form @submit.prevent="register">
        <label>
            Name:
            <input type="text" v-model="name" required />
        </label>
        <br />
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
        <button type="submit" :disabled="loading">Register</button>
        <p v-if="error" role="alert">{{ error }}</p>
    </form>
  </div>
</template>

<!-- Registration script -->
<script setup lang="ts">
const name = ref(''); // holds the name input
const email = ref(''); // holds the email input
const password = ref(''); // holds the password input
const loading = ref(false); // indicates if the registration request is in progress
const error = ref(''); // holds the error message if registration fails

async function register() {
  error.value = '' // reset error message
  loading.value = true // set loading state
  try {
    await $fetch('/api/auth/register', {
      method: 'POST',
      body: { name: name.value, email: email.value, password: password.value },
    })
    await navigateTo('/login') // redirect after successful registration
  } catch (err) {
    error.value = (err as { data?: { message?: string } }).data?.message ?? 'Registration failed' // set error message if registration fails
  } finally {
    loading.value = false // reset loading state
  }
}
</script>