<script setup lang="ts">
import type { FriendshipResult, SearchResult } from "#shared/types/friends";
import type { TabsItem } from "@nuxt/ui";

const { data: user, error } = await useFetch("/api/auth/profile");
if (error.value) {
  await navigateTo("/login");
}

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
        <SocialFriendList />
      </template>
      <template #requests>
        <SocialGetRequest />
      </template>
      <template #blocks>
        <SocialBlockedList />
      </template>
      <template #add>
        <SocialSendRequest />
      </template>
    </UTabs>
  </UContainer>
</template>
