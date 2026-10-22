<template>
  <div>
    <h1>Login</h1>
    <form @submit.prevent="login"> <!-- login => triggers the login function defined in the script -->
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
        <p v-if="error" role="alert">{{ error }}</p> <!-- show error message if login fails -->
    </form>
    <br />
    <NuxtLink to="/register">Don't have an account? Register here.</NuxtLink>
  </div>
</template>


<!-- Login script -->
<script setup lang="ts">
const email = ref(''); // holds the email input
const password = ref(''); // holds the password input
const loading = ref(false); // indicates if the login request is in progress
const error = ref(''); // holds the error message if login fails

async function login() {
  error.value = '' // reset error message
  loading.value = true // set loading state
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email: email.value, password: password.value },
    })
    await navigateTo('/profile') // redirect after successful login
  } catch (err) {
    error.value = (err as { data?: { message?: string } }).data?.message ?? 'Login failed' // set error message if login fails
  } finally {
    loading.value = false // reset loading state
  }
}
</script>

<!-- Inputs with v-model hold the email and password in refs. ref is auto-imported-->
<!-- Submit handler, sends values to server with $fetch. The @submit.prevent stops browser from reloading the page. -->
<!-- Loading and error state, button is disabled when loading and error message is shown if login fails -->
<!-- redirect with navigateTo after successful login -->