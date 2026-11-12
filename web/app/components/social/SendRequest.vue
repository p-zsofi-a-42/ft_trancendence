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
    <UForm @submit.prevent="searchUsers">
      <UInput
        placeholder="Search for users..."
        v-model="searchQuery"
        name="searchQuery"
        required
      />
      <UButton type="submit" :disabled="loading">Search</UButton>
    </UForm>
    <div class="py-4" v-if="searchResults.length">
      <h2 class="pb-4">Search Results</h2>
      <UListbox :items="searchResults" value-key="id" class="w-full">
        <template #item-label="{ item }">
          <UUser
            :name="item.name"
            :avatar="{
              loading: 'lazy',
              icon: 'i-lucide-user',
            }"
            chip
            size="xl"
          />
        </template>
        <template #item-trailing="{ item }">
          <UButton v-if="item.friendship === 'friends'">Friends</UButton>
          <UButton v-else-if="item.friendship === 'outgoing'"
            >Request sent</UButton
          >
          <UButton v-else-if="item.friendship === 'incoming'">
            Request pending
          </UButton>
          <UButton
            v-else
            :disabled="sending.has(item.id)"
            @click.stop="addFriend(item.id)"
          >
            Add friend
          </UButton>
        </template>
      </UListbox>
    </div>
  </UContainer>
</template>
