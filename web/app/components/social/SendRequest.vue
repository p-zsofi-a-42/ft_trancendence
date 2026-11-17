<script setup lang="ts">
import type { select, selectMenu } from "#build/ui";
import type { FriendshipResult, SearchResult } from "#shared/types/friends";

const searchResults = ref<SearchResult[]>([]); // Stores the results of the user search
const searchQuery = ref(""); // Stores the current search query entered by the user
const loading = ref(false); // Indicates whether a search request is currently in progress
const sending = ref<Set<string>>(new Set()); // Tracks the IDs of users for whom a friend request is being sent

// Function to add a friend by ID and send a friend request
const addFriend = async (id: string) => {
  sending.value.add(id);
  console.log(`Sending friend request to ${id}`);
  try {
    const { friendship } = await $fetch<FriendshipResult>("/api/friends/add", {
      method: "POST",
      body: { id },
    });
    // Show the status the server returned, which can already be a request or a friendship
    const result = searchResults.value.find((r) => r.id === id);
    if (result) {
      result.friendship = friendship;
    }
    // Reload the friend list so the new request appears under Sent requests
    await refreshNuxtData("friends-list");
  } catch (err: any) {
    alert(
      err.statusCode === 409
        ? "Request already exists"
        : "An unexpected error occurred",
    );
  } finally {
    // Remove the ID from the sending set after the request is finished
    sending.value.delete(id);
  }
};

// Function to search for users by query
const searchUsers = async () => {
  // console.log('Searching for users with query:', searchQuery.value);
  loading.value = true;
  try {
    const response = await $fetch("/api/auth/search", {
      method: "POST",
      body: {
        query: searchQuery.value,
      },
    });
    // Cast the response to the SearchResult type
    searchResults.value = response as SearchResult[];
  } catch (err) {
    alert("An unexpected error occurred");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <UContainer class="justify-center items-center">
    <UCard
      :ui="{
        root: 'w-full h-full text-white',
        body: 'text-center items-start',
      }"
      variant="subtle"
    >
      <UForm @submit.prevent="searchUsers">
        <UInput
          placeholder="Search for users..."
          v-model="searchQuery"
          name="searchQuery"
          required
        />
        <UButton type="submit" :disabled="loading">Search</UButton>
      </UForm>
    </UCard>
    <UCard
      title="Search Results"
      :ui="{
        root: 'w-full h-full text-white mt-4 py-4',
        body: 'text-center items-start',
      }"
      variant="subtle"
      v-if="searchResults.length"
    >
      <CustomUserList :list="searchResults">
        <template #trailing="{ user }">
          <UButton v-if="user.friendship === 'friends'">Friends</UButton>
          <UButton v-else-if="user.friendship === 'outgoing'"
            >Request sent</UButton
          >
          <UButton v-else-if="user.friendship === 'incoming'">
            Request pending
          </UButton>
          <UButton
            v-else
            :disabled="sending.has(user.id)"
            @click.stop="addFriend(user.id)"
          >
            Add friend
          </UButton>
        </template>
      </CustomUserList>
    </UCard>
  </UContainer>
</template>
