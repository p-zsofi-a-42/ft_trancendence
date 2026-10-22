<!-- Button to logout of current user session for the authenticated user -->
<template>
    <button @click="logout">Logout</button>
</template>

<script setup lang="ts">

// Function to handle user logout
// Sends a POST request to the server to log out the current user and navigates to the login page on success.
const logout = async () => {
    // Send logout request to the server
    try {
        await fetch('/api/auth/logout', { method: 'POST' })
        await navigateTo('/login')
    } catch (err) {
        console.error('Logout failed', err)
    }
}
</script>