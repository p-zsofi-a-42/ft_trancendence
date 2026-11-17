<script setup lang="ts">
import type { FriendEntry } from "#shared/types/friends";
import type { SplitterItem } from "@nuxt/ui";

const { data, error, refresh } = useFetch<FriendEntry[]>("/api/friends", {
  key: "friends-list",
  default: () => [],
});

const incoming = computed(() =>
  (data.value ?? []).filter((f) => f.friendship === "incoming"),
); // Incoming friend requests
const outgoing = computed(() =>
  (data.value ?? []).filter((f) => f.friendship === "outgoing"),
); // Outgoing friend requests

// ACCEPT FRIEND-REQUESTS
const accepting = ref<Set<string>>(new Set());

const acceptRequest = async (id: string) => {
  accepting.value.add(id);
  try {
    await $fetch("/api/friends/accept", { method: "POST", body: { id } });
    await refresh();
  } catch (err: any) {
    alert(
      err.statusCode === 404
        ? "No pending request from this user"
        : "An unexpected error occurred",
    );
  } finally {
    accepting.value.delete(id);
  }
};

// DECLINE FRIEND-REQUESTS
const declining = ref<Set<string>>(new Set()); // IDs of users whose request is being declined

// Declines a pending request from the given user, then reloads the list
const declineRequest = async (id: string) => {
  declining.value.add(id);
  try {
    await $fetch("/api/friends/decline", { method: "POST", body: { id } });
    await refresh();
  } catch (err: any) {
    alert(
      err.statusCode === 404
        ? "No pending request from this user"
        : "An unexpected error occurred",
    );
  } finally {
    declining.value.delete(id);
  }
};

const splitterItems: SplitterItem[] = [
  {
    slot: "incoming",
    minSize: 20,
    defaultSize: 50,
  },
  {
    slot: "outgoing",
    minSize: 20,
    defaultSize: 50,
  },
];
</script>

<template>
  <USplitter :items="splitterItems">
    <template #incoming>
      <UCard
        title="incoming Requests"
        :ui="{
          root: 'w-full h-full text-white',
          body: 'text-center items-start',
        }"
        variant="subtle"
      >
        <CustomUserList :list="incoming">
          <template #trailing="{ user }">
            <UButton
              :disabled="accepting.has(user.id)"
              @click="acceptRequest(user.id)"
              leading-icon="i-lucide-check"
            />
            <UButton
              :disabled="declining.has(user.id)"
              @click="declineRequest(user.id)"
              leading-icon="i-lucide-x"
            />
          </template>
        </CustomUserList>
        <p v-if="!incoming.length">No incoming requests.</p>
      </UCard>
    </template>
    <template #outgoing>
      <UCard
        title="Outgoing Requests"
        :ui="{
          root: 'w-full text-white',
          body: 'text-center items-start',
        }"
        variant="subtle"
      >
        <CustomUserList :list="outgoing" />
        <p v-if="!outgoing.length">No sent requests.</p>
      </UCard>
    </template>
  </USplitter>
</template>
