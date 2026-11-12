<script setup lang="ts">
import type { card, pageBody } from "#build/ui";
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
    slot: "incomming",
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
  <USplitter
    :items="splitterItems"
    :ui="{
      root: 'w-full min-h-0 pt-4',
      panel: 'h-full min-h-0 justify-center',
    }"
  >
    <template #incomming>
      <UCard
        title="Incomming Requests"
        :ui="{
          root: 'w-full text-white',
          body: 'text-center items-start',
        }"
        variant="subtle"
      >
        <ul>
          <li
            v-for="friend in incoming"
            :key="friend.id"
            class="border border-neutral-800 bg-neutral-900 rounded-xl p-2 mb-1 flex"
          >
            <UUser
              :name="friend.name"
              chip
              :avatar="{
                icon: 'i-lucide-user',
              }"
            >
            </UUser>
            <UButton
              :disabled="accepting.has(friend.id)"
              @click="acceptRequest(friend.id)"
              leading-icon="i-lucide-check"
            />

            <UButton
              :disabled="declining.has(friend.id)"
              @click="declineRequest(friend.id)"
              leading-icon="i-lucide-x"
            />
          </li>
        </ul>
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
        <ul>
          <li
            v-for="friend in outgoing"
            :key="friend.id"
            class="border border-neutral-800 bg-neutral-900 rounded-xl p-2 mb-1"
          >
            <UUser
              :name="friend.name"
              chip
              :avatar="{
                icon: 'i-lucide-user',
              }"
            />
          </li>
        </ul>
        <p v-if="!outgoing.length">No sent requests.</p>
      </UCard>
    </template>
  </USplitter>
</template>
