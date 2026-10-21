<template>
  <div>
    <h1>Profile</h1>
    <div v-if="user">
      <p><strong>Name:</strong> {{ user.name }}</p>
      <p><strong>Email:</strong> {{ user.email }}</p>
    </div>
  </div>
  <FriendList />
  <!-- Search for Users here-->
   <div>
     <form @submit.prevent="searchUsers">
       <input type="text" placeholder="Search for users..." v-model="searchQuery" required/>
       <button type="submit" :disabled="loading">Search</button>
     </form>
     <div v-if="searchResults.length">
       <h2>Search Results</h2>
       <ul>
         <li v-for="result in searchResults" :key="result.id">{{ result.name }}</li>
       </ul>
     </div>
   </div>
</template>

<script setup lang="ts">
const { data: user, error } = await useFetch('/api/auth/profile')
if (error.value) {
  await navigateTo('/login')
}

const searchQuery = ref('');
const searchResults = ref<{ id: string; name: string }[]>([]);
const loading = ref(false);
const searchUsers = async () => {
  // console.log('Searching for users with query:', searchQuery.value);
  loading.value = true;
  try {
    const response = await $fetch('/api/auth/search', {
      method: 'POST',
      body: {
        query: searchQuery.value
      }
    });
    searchResults.value = response;
  } catch (err) {
    alert('An unexpected error occurred');
  } finally {
    loading.value = false;
  }
}
</script>
