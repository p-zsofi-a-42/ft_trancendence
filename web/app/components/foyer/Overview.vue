<template>
  <USplitter
    :items="overviewItems"
    disabled
    :ui="{
      root: 'w-full min-h-0 py-4',
      panel: 'h-full min-h-0',
    }"
  >
    <template #settings>
      <FoyerOverviewSettings
        :game-code="props.gameCode"
        v-model="settingsModel"
      />
    </template>

    <template #players>
      <UCard
        title="Players"
        variant="foyer"
        :ui="{
          body: 'text-center',
          header: 'border-b-2 border-border-accented',
        }"
      >
        <CustomUserList :list="players.map((p: Player) => p.user)" />
        <p v-if="!players.length">No Players</p>
      </UCard>
    </template>

    <template #invite>
      <UCard
        title="Invite to Foyer"
        variant="foyer"
        :ui="{
          root: 'flex h-full flex-col text-center',
          body: 'flex flex-1 min-h-0 flex-col gap-2',
          header: 'border-b-2 border-border-accented',
          footer: 'border-t-2 border-border-accented',
        }"
      >
        <p v-if="!friends.length">No Friends :(</p>

        <CustomUserList :list="friends">
          <template #trailing>
            <UButton> Invite </UButton>
          </template>
        </CustomUserList>

        <template #footer>
          <p class="font-bold mb-2">Foyer Code</p>
          <CustomCopyField :text="toDisplayString(gameCode)" label="Code" />
        </template>
      </UCard>
    </template>
  </USplitter>
</template>

<script setup lang="ts">
import type { SplitterItem } from "@nuxt/ui";
import type { Game, Player } from "#shared/types/game";
import { toDisplayString } from "vue";

const props = defineProps<{
  gameCode: string;
}>();

const settingsModel = defineModel<Game>({
  required: true,
});

// TODO: ensure that players is a "global" variable accessible across all foyer files
let players = ref(
  await $fetch<Player[]>(`/api/game/${props.gameCode}/players`, {
    method: "GET",
  }),
);

let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let closedByUs = false;

async function connectWebSocket() {
  // Fresh Ticket on every connection attempt
  const ticket = await $fetch<{ ticket: string }>(
    `/api/foyer/${props.gameCode}/ws-ticket`,
    { method: "POST" },
  );
  console.log("Obtained WebSocket ticket:", ticket.ticket);
  // Connect to WebSocket with the obtained ticket
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  socket = new WebSocket(
    `${protocol}//${location.host}/ws/game?ticket=${ticket.ticket}`,
  );

  // Handle incoming events from the Websocket
  socket.onmessage = async (event) => {
    const payloadEvent = JSON.parse(event.data);
    console.log(`Event received: ${JSON.stringify(payloadEvent)}`);
    if (payloadEvent.type == "joined")
      players.value = await $fetch<Player[]>(
        `/api/game/${props.gameCode}/players`,
        { method: "GET" },
      );
  };

  // Handle WebSocket close event
  socket.onclose = () => {
    if (closedByUs) return;
    reconnectTimer = setTimeout(connectWebSocket, 2000);
  };
}
// Connect WebSocket on component mount
onMounted(connectWebSocket);
// Disconnect WebSocket on component unmount
onBeforeUnmount(() => {
  closedByUs = true;
  if (reconnectTimer) clearTimeout(reconnectTimer);
  socket?.close();
});

// FETCH FRIENDS LIST
const { data } = useFetch<FriendEntry[]>("/api/friends", {
  key: "friends-list",
  default: () => [],
});

const friends = computed(() =>
  (data.value ?? []).filter((f) => f.friendship === "friends"),
); // Friends list

const overviewItems: SplitterItem[] = [
  {
    slot: "settings",
    minSize: 20,
    defaultSize: 100 / 3,
  },
  {
    slot: "players",
    minSize: 20,
    defaultSize: 100 / 3,
  },
  {
    slot: "invite",
    minSize: 20,
    defaultSize: 100 / 3,
  },
];
</script>
