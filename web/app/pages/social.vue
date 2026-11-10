<script setup lang="ts">
import type { FriendshipResult, SearchResult } from "#shared/types/friends";
import type { TabsItem } from "@nuxt/ui";
import RequestList from "~/components/social/RequestList.vue";
import SendRequest from "~/components/social/SendRequest.vue";

const { data: user, error } = await useFetch("/api/auth/profile");
if (error.value) {
  await navigateTo("/login");
}

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

const socialItems: TabsItem[] = [
  {
    label: "Friends",
    slot: "friends",
  },
  {
    label: "Requests",
    slot: "requests",
  },
  {
    label: "Blocked",
    slot: "blocks",
  },
  {
    label: "Add a Friend",
    slot: "add",
  },
];
</script>

<template>
  <UContainer class="h-full py-4">
    <UTabs
      :items="socialItems"
      :ui="{
        root: 'bg-neutral-900 rounded-2xl p-4 h-full',
        content: 'h-full text-white text-center m-2',
      }"
    >
      <template #friends>
        <Friends />
      </template>
      <template #requests>
        <SocialRequestList />
      </template>
      <template #blocks>
        <BlockedUsers />
      </template>
      <template #add>
        <SocialSendRequest />
      </template>
    </UTabs>
  </UContainer>
</template>
