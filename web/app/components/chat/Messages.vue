<template>
  <div class="fixed bottom-0 right-0 z-50 w-96 max-w-[calc(100vw-2rem)]">
    <UAccordion
      :items="items"
      :ui="{
        root: 'rounded-tl-2xl bg-app-background shadow-lg',
        trigger: 'px-4 py-3',
        content: 'border-t border-accented',
        body: 'p-4',
      }"
    >
      <template #messages>
        <div class="flex h-96 min-h-0 p-2">
          <aside v-if="!selectedFriend" class="min-h-0 flex-1 overflow-y-auto">
            <div
              v-if="friendsError"
              class="flex h-full w-full flex-col items-center justify-center gap-2"
            >
              <p class="text-error">Could not load friends.</p>
            </div>
            <div
              v-else-if="!friends.length"
              class="flex h-full w-full flex-col items-center justify-center gap-2"
            >
              <UIcon name="i-lucide-ghost" class="size-20" />
              <p class="text-sm">No friends :(</p>
            </div>

            <UScrollArea v-else>
              <CustomUserList :list="friends">
                <template #trailing="{ user }">
                  <UButton
                    icon="i-myOwn-message-square"
                    :aria-label="`Message ${user.name}`"
                    :loading="openingId === user.id"
                    @click="openConversation(user)"
                  />
                </template>
              </CustomUserList>
            </UScrollArea>
          </aside>

          <div v-else class="min-h-0 min-w-0 flex-1">
            <ChatConversation
              v-if="conversation && selectedFriend"
              :key="conversation.id"
              :conversation-id="conversation.id"
              :friend-user="selectedFriend"
              @close="closeConversation"
            />
          </div>
        </div>
      </template>
    </UAccordion>
  </div>
</template>

<script setup lang="ts">
import type { ConversationResult } from "#shared/types/chats";
import type { FriendEntry } from "#shared/types/friends";

const items = [{ label: "Messages", value: "messages", slot: "messages" }];
const toast = useToast();

const { data: friendData, error: friendsError } = await useFetch<FriendEntry[]>(
  "/api/friends",
  {
    key: "friends-list",
    default: () => [],
  },
);

const friends = computed(() =>
  (friendData.value ?? []).filter((friend) => friend.friendship === "friends"),
);

const openingId = ref<string | null>(null);
const selectedFriend = ref<FriendEntry | null>(null);
const conversation = ref<ConversationResult | null>(null);

function closeConversation() {
  selectedFriend.value = null;
  conversation.value = null;
}

async function openConversation(friend: FriendEntry) {
  openingId.value = friend.id;

  try {
    conversation.value = await $fetch<ConversationResult>("/api/chats", {
      method: "POST",
      body: { id: friend.id },
    });
    selectedFriend.value = friend;
  } catch {
    toast.add({
      title: "Chat failed",
      description: "Could not open a conversation with this friend.",
      color: "error",
    });
  } finally {
    openingId.value = null;
  }
}
</script>
