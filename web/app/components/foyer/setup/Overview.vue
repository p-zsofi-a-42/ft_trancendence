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
      <UCard
        title="Game Settings"
        variant="foyer"
        :ui="{
          root: 'flex h-full flex-col',
          header: 'border-b-2 border-neutral-600',
          body: 'flex flex-1 flex-col gap-2',
        }"
      >
        <!-- <UForm
          id="foyer-settings-form"
          class="flex flex-col gap-4"
          :state="settings"
          :schema="settingsSchema"
          @submit="submit"
        >
          <FormFieldString
            v-model="settings.cityName"
            label="City Name"
            name="cityName"
            placeholder="Baguette City"
            required
          />

          <FormFieldNumber
            v-model="settings.companyCount"
            label="Number of companies"
            name="companyCount"
            :min="limits.companyCount.min"
            :max="limits.companyCount.max"
            slider
            required
          />

          <FormFieldNumber
            v-model="settings.startingCapital"
            label="Starting capital"
            name="startingCapital"
            :min="limits.startingCapital.min"
            :max="limits.startingCapital.max"
            :step="1_000"
            required
          />

          <FormFieldNumber
            v-model="settings.roundCount"
            label="Number of rounds"
            name="roundCount"
            :min="limits.roundCount.min"
            :max="limits.roundCount.max"
            required
          />
          <UButton disabled> Save </UButton>
        </UForm> -->
      </UCard>
    </template>

    <template #players>
      <UCard
        title="Players"
        variant="foyer"
        :ui="{ body: 'text-center', header: 'border-b-2 border-neutral-600' }"
      >
        <ul>
          <li v-for="company in companies">
            <p>{{ company }}</p>
          </li>
        </ul>
        <!--        <CustomUserList :list="players" />
        <p v-if="!players.length">No Players</p> -->
      </UCard>
    </template>

    <template #invite>
      <UCard
        title="Invite to Foyer"
        variant="foyer"
        :ui="{
          root: 'flex h-full flex-col text-center',
          body: 'flex flex-1 min-h-0 flex-col gap-2',
          header: 'border-b-2 border-neutral-600',
          footer: 'border-t-2 border-neutral-600',
        }"
      >
        <CustomUserList :list="friends">
          <template #trailing>
            <UButton> Invite </UButton>
          </template>
        </CustomUserList>

        <p v-if="!friends.length">No Friends :(</p>

        <template #footer>
          <p class="font-bold mb-2">Foyer Code</p>
          <CustomCopyField :text="toDisplayString(gameCode)" label="Code" />
        </template>
      </UCard>
    </template>
  </USplitter>
</template>

<script setup lang="ts">
import type { FormSubmitEvent, SplitterItem } from "@nuxt/ui";
import type { Game } from "#shared/types/game";
import { toDisplayString } from "vue";
import * as z from "zod";

const route = useRoute();
const { user } = useUserSession();
const gameCode: string = String(route.params.code);

/* let settings = ref(await $fetch(`/api/game/${props.gameCode}`, { method: "GET" })); */
let companies = ref(
  await $fetch(`/api/game/${gameCode}/companies`, { method: "GET" }),
);

const players: UserSummary[] = [];

console.log(`props.companies ${JSON.stringify(companies)}`);

let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let closedByUs = false;

async function connectWebSocket() {
  // Fresh Ticket on every connection attempt
  const ticket = await $fetch<{ ticket: string }>(
    `/api/foyer/${gameCode}/ws-ticket`,
    { method: "POST" },
  );
  console.log("Obtained WebSocket ticket:", ticket.ticket);
  // Connect to WebSocket with the obtained ticket
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  socket = new WebSocket(
    `${protocol}//${location.host}/ws/game?ticket=${ticket.ticket}`,
  );

  // Handle incoming events from the Websocket
  socket.onmessage = (event) => {
    const payloadEvent = JSON.parse(event.data);
    console.log(`Event received: ${JSON.stringify(payloadEvent)}`);
    if (payloadEvent.type == "joined") {
      companies.value.push(payloadEvent.company);
    }
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

const emit = defineEmits<{
  continue: [];
}>();

const limits = {
  companyCount: { min: 1, max: 5 },
  startingCapital: { min: 1, max: 1_000_000 },
  roundCount: { min: 1, max: 34 },
};

const settingsSchema = z.object({
  cityName: z.string().trim().min(1, "Required"),

  companyCount: z
    .number({ error: "Enter a valid number" })
    .int("Must be a whole number")
    .min(limits.companyCount.min, "Choose a value from 1 to 5")
    .max(limits.companyCount.max, "Choose a value from 1 to 5"),

  startingCapital: z
    .number({ error: "Enter a valid number" })
    .int("Must be a whole number")
    .min(limits.startingCapital.min, "Choose a value from 1 to 1.000.000")
    .max(limits.startingCapital.max, "Choose a value from 1 to 1.000.000"),

  roundCount: z
    .number({ error: "Enter a valid number" })
    .int("Must be a whole number")
    .min(limits.roundCount.min, "Choose a value from 1 to 34")
    .max(limits.roundCount.max, "Choose a value from 1 to 34"),
});

async function submit(event: FormSubmitEvent<Game>) {
  emit("continue");
}
</script>
