<!-- Component to display the list of friends -->
<script setup lang="ts">
import type { FriendEntry } from "#shared/types/friends";
import type { ConversationResult } from "#shared/types/chats";

// MESSAGING FRIENDS
const messaging = ref<Set<string>>(new Set());
const chatResponse = ref<ConversationResult | null>(null);
/* Requesting a conversationID for messaging a friend.
On success, go to /chats/:id */
const messageFriend = async (id: string) => {
  messaging.value.add(id);
  try {
    chatResponse.value = await $fetch("/api/chats", {
      method: "POST",
      body: { id },
    });
    if (chatResponse.value?.id) navigateTo(`/chats/${chatResponse.value.id}`);
    await refresh();
  } catch (err: any) {
    alert(
      err.statusCode === 404
        ? "No chat with this user"
        : "An unexpected error occurred",
    );
  } finally {
    messaging.value.delete(id);
  }
};

// FETCH FRIENDS LIST
const { data, error, refresh } = useFetch<FriendEntry[]>("/api/friends", {
  key: "friends-list",
  default: () => [],
});

const friends = computed(() =>
  (data.value ?? []).filter((f) => f.friendship === "friends"),
); // Friends list

// REMOVE FRIEND
const removing = ref<Set<string>>(new Set()); // IDs of users whose friendship is being removed
// Removes a friend, then reloads the list
const removeFriend = async (id: string) => {
  removing.value.add(id);
  try {
    await $fetch("/api/friends/remove", { method: "POST", body: { id } });
    await refresh();
  } catch (err: any) {
    alert(
      err.statusCode === 404
        ? "No friendship with this user"
        : "An unexpected error occurred",
    );
  } finally {
    removing.value.delete(id);
  }
};

// BLOCK USERS
const blocking = ref<Set<string>>(new Set()); // IDs of users being blocked
// Blocks a user, then reloads the list
const blockUser = async (id: string) => {
  blocking.value.add(id);
  try {
    await $fetch("/api/blocks/block", { method: "POST", body: { id } });
    await refresh();
  } catch (err: any) {
    alert(
      err.statusCode === 404 ? "No such user" : "An unexpected error occurred",
    );
  } finally {
    blocking.value.delete(id);
  }
};
</script>

<template>
  <UCard
    :ui="{
      root: 'w-full h-full text-white',
      body: 'text-center items-start',
    }"
    variant="subtle"
  >
    <CustomUserList :list="friends">
      <template #trailing="{ user }">
        <UButton
          :disabled="removing.has(user.id)"
          @click="removeFriend(user.id)"
        >
          Remove
        </UButton>
        <UButton :disabled="blocking.has(user.id)" @click="blockUser(user.id)">
          Block
        </UButton>
        <UButton
          :disabled="messaging.has(user.id)"
          @click="messageFriend(user.id)"
        >
          Message
        </UButton>
      </template>
    </CustomUserList>
    <p v-if="!friends.length">No friends yet.</p>
  </UCard>
</template>
