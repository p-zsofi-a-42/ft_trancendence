<template>
  <div>
    <!-- Profile Information -->
    <h1>Profile</h1>
    <div v-if="user">
      <p><strong>ID:</strong> {{ user.id }}</p>
      <p><strong>Name:</strong> {{ user.name }}</p>
      <p><strong>Email:</strong> {{ user.email }}</p>
    </div>
  </div>
  <!-- Friend list -->
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
         <li v-for="result in searchResults" :key="result.id">
          {{ result.name }}
          <!-- <template v-if="result.id !== user?.id"> -->
            <span v-if="result.friendship === 'friends'">Friends</span>
            <span v-else-if="result.friendship === 'outgoing'">Request sent</span>
            <span v-else-if="result.friendship === 'incoming'">Request pending</span>
            <button v-else :disabled="sending.has(result.id)" @click="addFriend(result.id)">
              Add friend
            </button>
            <!-- <button  @click="addFriend(result.id)"> -->
          <!-- </template> -->
          <!-- <button @click="addFriend(result.id)">Add Friend</button> -->
         </li>
       </ul>
     </div>
     <BlockedUsers />
   </div>
</template>

<script setup lang="ts">
// Fetch the current user's profile information and handle authentication redirect if not logged in
const { data: user, error } = await useFetch('/api/auth/profile')
if (error.value) {
  await navigateTo('/login')
}

import type { FriendshipResult, SearchResult } from '#shared/types/friends'
const searchResults = ref<SearchResult[]>([]); // Stores the results of the user search
const searchQuery = ref(''); // Stores the current search query entered by the user
const loading = ref(false); // Indicates whether a search request is currently in progress
const sending = ref<Set<string>>(new Set()); // Tracks the IDs of users for whom a friend request is being sent

// Function to add a friend by ID and send a friend request
const addFriend = async (id: string) => {
  sending.value.add(id)
  console.log(`Sending friend request to ${id}`)
  try {
    const { friendship } = await $fetch<FriendshipResult>('/api/friends/add', { method: 'POST', body: { id } })
    // Show the status the server returned, which can already be a request or a friendship
    const result = searchResults.value.find(r => r.id === id)
    if (result) {
      result.friendship = friendship
    }
    // Reload the friend list so the new request appears under Sent requests
    await refreshNuxtData('friends-list')
  } catch (err: any) {
    alert(err.statusCode === 409 ? 'Request already exists' : 'An unexpected error occurred')
  } finally {
    // Remove the ID from the sending set after the request is finished
    sending.value.delete(id)
  }
}

// Function to search for users by query
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
    // Cast the response to the SearchResult type
    searchResults.value = response as SearchResult[];
  } catch (err) {
    alert('An unexpected error occurred');
  } finally {
    loading.value = false;
  }
}
</script>
