<template>
  <UCard
    :ui="{
      root: 'h-full w-full min-h-0 ring-0 p-0 mx-auto',
      header: 'shrink-0 p-2',
      body: 'flex min-h-0 flex-1 flex-col',
      footer: 'shrink-0 pb-1 pt-3',
    }"
  >
    <template #header>
      <div class="flex shrink-0">
        <UButton
          icon="i-lucide-arrow-left"
          aria-label="Back to messages"
          @click="emit('close')"
        />
        <CustomUser :user="props.friendUser" class="mx-auto" />
        <UButton icon="i-lucide-info" />
      </div>
    </template>

    <UScrollArea
      ref="messagesScrollArea"
      class="messages-scroll min-h-0 flex-1"
    >
      <p v-if="loadError" class="shrink-0 py-2 text-error">{{ loadError }}</p>

      <ul v-else class="min-h-0 space-y-2">
        <li v-for="message in messages" :key="message.id">
          <div
            class="w-fit max-w-[85%] rounded-lg p-2"
            :class="
              message.sender_id === user?.id
                ? 'ml-auto bg-primary-700'
                : 'bg-neutral-700'
            "
          >
            <p class="whitespace-pre-wrap wrap-anywhere">
              {{ message.body }}
            </p>
            <time class="text-xs">{{
              new Date(message.created_at).toLocaleTimeString()
            }}</time>
          </div>
        </li>
      </ul>
    </UScrollArea>

    <template #footer>
      <UForm @submit="send" class="flex w-full shrink-0">
        <UInput
          :id="messageInputId"
          v-model="text"
          autofocus
          class="min-w-0 w-full"
          maxlength="2000"
          placeholder="Write a message"
          :readonly="sending"
        />
        <UButton type="submit" :disabled="sending || !text.trim()"
          >Send</UButton
        >
      </UForm>
      <p v-if="sendError" class="pt-1 text-error">{{ sendError }}</p>
    </template>
  </UCard>
</template>

<script setup lang="ts">
import type { ChatMessage } from "#shared/types/chats";
import { useId } from "vue";

const props = defineProps<{
  conversationId: string;
  friendUser: FriendEntry;
}>();

const emit = defineEmits<{ close: [] }>();

const { user } = useUserSession();

const { data, error } = await useFetch<ChatMessage[]>(
  () => `/api/chats/${props.conversationId}/messages`,
  {
    key: computed(() => `chat-${props.conversationId}`),
    default: () => [],
  },
);

const messages = computed(() => [...data.value].reverse());
const messageInputId = useId();
const messagesScrollArea = ref<{ $el: HTMLElement } | null>(null);

async function scrollToLast() {
  await nextTick();

  const el = messagesScrollArea.value?.$el;
  el?.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
}

watch(messages, scrollToLast, { flush: "post", immediate: true });

function addMessage(message: ChatMessage) {
  if (data.value.some((current) => current.id === message.id)) return;
  data.value = [message, ...data.value];
}

function errorMessage(err: unknown) {
  const status = (err as { statusCode?: number }).statusCode;
  if (status === 403) return "You cannot message this user.";
  if (status === 404) return "This conversation does not exist.";
  if (status === 400)
    return "The message must be between 1 and 2000 characters.";
  return "The message could not be sent.";
}

const loadError = computed(() =>
  error.value ? errorMessage(error.value) : "",
);
const text = ref("");
const sending = ref(false);
const sendError = ref("");
let attempt: { text: string; clientId: string } | null = null;

async function markAsRead() {
  const newest = data.value[0];
  if (!newest) return;

  try {
    await $fetch(`/api/chats/${props.conversationId}/read`, {
      method: "POST",
      body: { last_message_id: newest.id },
    });
  } catch {
    // Unread indicator stays longer
  }
}

let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let closedByUs = false;

function scheduleReconnect() {
  if (closedByUs || reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    void connectChatSocket();
  }, 2000);
}

async function connectChatSocket() {
  try {
    const { ticket } = await $fetch<{ ticket: string }>(
      `/api/chats/${props.conversationId}/ws-ticket`,
      { method: "POST" },
    );

    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    socket = new WebSocket(
      `${protocol}//${location.host}/ws/chat?ticket=${ticket}`,
    );

    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.type !== "message") return;
      addMessage(payload.message);
      void markAsRead();
    };

    socket.onclose = scheduleReconnect;
  } catch {
    scheduleReconnect();
  }
}

onMounted(() => {
  void markAsRead();
  void connectChatSocket();
});

onBeforeUnmount(() => {
  closedByUs = true;
  if (reconnectTimer) clearTimeout(reconnectTimer);
  socket?.close();
});

async function send() {
  const body = text.value.trim();
  if (!body || sending.value) return;

  if (!attempt || attempt.text !== body)
    attempt = { text: body, clientId: crypto.randomUUID() };

  sending.value = true;
  sendError.value = "";

  try {
    const message = await $fetch<ChatMessage>(
      `/api/chats/${props.conversationId}/messages`,
      {
        method: "POST",
        body: { body, client_id: attempt.clientId },
      },
    );
    addMessage(message);
    text.value = "";
    attempt = null;
  } catch (err) {
    if ((err as { statusCode?: number }).statusCode === 401) {
      await navigateTo("/login");
    }
    sendError.value = errorMessage(err);
  } finally {
    sending.value = false;
    await markAsRead();

    setTimeout(() => {
      document.getElementById(messageInputId)?.focus();
    }, 0);
  }
}
</script>

<style scoped lang="css">
.messages-scroll {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.messages-scroll::-webkit-scrollbar {
  display: none;
}
</style>
