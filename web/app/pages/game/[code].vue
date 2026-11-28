<!-- HTML CONTENT -->
<template>
  <div class="h-[90vh] w-full my-4">
    <UButton
      class="mobile-sidebar-toggle mobile-sidebar-toggle--left"
      :icon="
        leftOpen ? 'i-lucide-panel-left-close' : 'i-lucide-panel-left-open'
      "
      :aria-label="leftOpen ? 'Close game menu' : 'Open game menu'"
      @click="leftOpen = !leftOpen"
    />
    <UButton
      class="mobile-sidebar-toggle mobile-sidebar-toggle--right"
      :icon="
        rightOpen ? 'i-lucide-panel-right-close' : 'i-lucide-panel-right-open'
      "
      :aria-label="rightOpen ? 'Close news sidebar' : 'Open news sidebar'"
      @click="rightOpen = !rightOpen"
    />
    <USplitter
      ref="gameSplitter"
      id="game-layout"
      :items="splitterItems"
      disabled
    >
      <template #left>
        <CustomSidebar title="Menu" :is-wide="isWide" v-model:isOpen="leftOpen">
          <UTabs
            v-model="activeTab"
            :items="tabsItems"
            orientation="vertical"
            :content="false"
            size="xl"
            :ui="{
              root: 'mt-4',
              list: 'w-full gap-2',
            }"
          />
        </CustomSidebar>
      </template>

      <template #main>
        <main class="flex flex-col h-full w-full min-w-0 gap-6 overflow-auto">
          <header
            class="grid grid-cols-[minmax(0,1fr)_minmax(7.5rem,max-content)_minmax(0,1fr)]"
          >
            <div
              class="h-14 min-w-0 p-3 border-3 border-r-0 border-primary rounded-bl-2xl bg-bg"
            >
              {{ money }}€
            </div>

            <div
              class="border-4 border-primary rounded-b-2xl text-center p-2 inset-1 z-10 bg-bg text-text"
            >
              <h1 class="text-3xl font-bold">{{ roundTimer }}</h1>
              <p>{{ currentRound }} / {{ maxRounds }}</p>
            </div>
            <div
              class="flex justify-end h-14 min-w-0 border-3 border-l-0 border-primary rounded-br-2xl bg-bg text-right"
            >
              <UModal
                v-model:open="pauseModalOpen"
                :close="false"
                :dismissible="false"
                :ui="{
                  content: 'w-fit rounded-2xl',
                  header: 'justify-center text-center',
                  footer: 'justify-center',
                }"
              >
                <UButton
                  icon="i-lucide-pause"
                  class="rounded-l-none rounded-t-none min-w-12 min-h-fit justify-center"
                  :disabled="!isGameOwner"
                  @click="pauseRound"
                />
                <template #title> Game paused </template>
                <template #description>
                  Wait for the game owner to resume.
                </template>
                <template #footer>
                  <UButton
                    label="Resume"
                    :disabled="!isGameOwner"
                    :loading="!isGameOwner"
                    @click="resumeRound"
                  />
                </template>
              </UModal>
            </div>
          </header>

          <section class="min-h-0 flex-1 rounded-2xl bg-bg p-4">
            <GameViewOverview
              v-if="activeTab === 'overview'"
              :resize="overviewResize"
            />
            <GameViewStatistics v-if="activeTab === 'statistics'" />
            <GameViewFinance v-if="activeTab === 'finance'" />
            <GameViewSales v-if="activeTab === 'sales'" />
            <GameViewDevelopment v-if="activeTab === 'development'" />
          </section>
        </main>
      </template>

      <template #right>
        <CustomSidebar
          title="News"
          side="right"
          :is-wide="isWide"
          v-model:isOpen="rightOpen"
        />
      </template>
    </USplitter>
  </div>
</template>

<!-- LOGIC -->
<script setup lang="ts">
import type { Game, Company, Round, RoundData } from "#shared/types/game";
import type { SplitterItem, TabsItem } from "@nuxt/ui";
import { nextTick, useTemplateRef, watch } from "vue";

definePageMeta({ middleware: "auth" });

type GameTab = "overview" | "statistics" | "finance" | "sales" | "development";
type RoundStateEvent = RoundData & { type: "round_state_changed" };

const code = useRoute().params.code as string;
const activeTab = ref<GameTab>("overview");

const money = ref(0);
const roundTimer = ref("--:--");
const currentRound = ref(0);
const maxRounds = ref(0);

const splitter = useTemplateRef("gameSplitter");
const isWide = ref(false);
const leftOpen = ref(false);
const rightOpen = ref(false);
const overviewResize = ref(true);
const pauseModalOpen = ref(false);

let sidebarQuery: MediaQueryList | undefined;
let gridQuery: MediaQueryList | undefined;

function syncSidebarDefaults() {
  const openByDefault = sidebarQuery?.matches ?? false;

  isWide.value = openByDefault;
  leftOpen.value = openByDefault;
  rightOpen.value = openByDefault;
}

function syncOverviewGrid() {
  overviewResize.value = !(gridQuery?.matches ?? false);
}

const { user } = useUserSession();
const game = await $fetch<Game>(`/api/game/${code}`, { method: "GET" });
const isGameOwner = String(game.creatorId) === user.value.id;

// TODO: provisional redirect
try {
  console.log("User session:", JSON.stringify(user.value));
  console.log("Game data:", JSON.stringify(game));
  maxRounds.value = game.nRounds;
  const companies = await $fetch<Company[]>(`/api/game/${code}/companies`, {
    method: "GET",
  });
  if (game.status === "created") navigateTo(`/foyer/${game.idCode}`);
  else if (game.status === "done") navigateTo(`/results/${game.idCode}`);
  if (!companies.some((c: Company) => c.userId == user.value.id))
    navigateTo("/play");
} catch (error) {
  console.error("Error fetching game data:", error);
}

let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let closedByUs = false;
let timerId: ReturnType<typeof setInterval> | undefined;

const roundData = ref<Round | null>(null);
const remainingMs = ref(0);

function stopTimer() {
  if (timerId !== undefined) clearInterval(timerId);
  timerId = undefined;
}

function startTimer() {
  stopTimer();

  timerId = setInterval(() => {
    if (roundData.value?.status !== "ongoing") {
      stopTimer();
      return;
    }

    remainingMs.value = Math.max(remainingMs.value - 1000, 0);
    setTimer(remainingMs.value);

    if (remainingMs.value === 0) stopTimer();
  }, 1000);
}

function applyRoundState({ round, serverNow }: RoundData) {
  roundData.value = round;
  currentRound.value = round.index + 1;
  remainingMs.value = Math.max(
    new Date(round.endsAt).getTime() - new Date(serverNow).getTime(),
    0,
  );
  setTimer(remainingMs.value);

  if (round.status === "paused") {
    pauseModalOpen.value = true;
    stopTimer();
    return;
  }

  pauseModalOpen.value = false;

  if (round.status === "ongoing" && remainingMs.value > 0) {
    startTimer();
  } else {
    stopTimer();
  }
}

async function pauseRound() {
  const activeRound = roundData.value;
  if (!activeRound || activeRound.status !== "ongoing") return;

  const state = await $fetch<RoundData>(
    `/api/game/rounds/${activeRound.id}/state`,
    { method: "POST" },
  );
  applyRoundState(state);

  activeRound.status = "paused";
}

async function resumeRound() {
  const activeRound = roundData.value;
  if (!activeRound || activeRound.status !== "paused") return;

  const state = await $fetch<RoundData>(
    `/api/game/rounds/${activeRound.id}/state`,
    { method: "POST" },
  );
  applyRoundState(state);

  activeRound.status = "ongoing";
}

async function connectWebSocket() {
  // Fresh Ticket on every connection attempt
  const ticket = await $fetch<{ ticket: string }>(
    `/api/foyer/${code}/ws-ticket`,
    { method: "POST" },
  );
  console.log("Obtained WebSocket ticket (game):", ticket.ticket);
  // Connect to WebSocket with the obtained ticket
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  socket = new WebSocket(
    `${protocol}//${location.host}/ws/game?ticket=${ticket.ticket}`,
  );

  // Handle incoming events from the Websocket
  socket.onmessage = async (event) => {
    const payloadEvent = JSON.parse(event.data) as
      | RoundStateEvent
      | { type: "round_finished" };

    console.log(`Event received: ${JSON.stringify(payloadEvent)}`);

    if (payloadEvent.type === "round_state_changed") {
      applyRoundState(payloadEvent);
    } else if (payloadEvent.type == "round_finished") {
      await setUpTimer();
    }
  };

  socket.onopen = () => {
    void setUpTimer();
  };

  // Handle WebSocket close event
  socket.onclose = () => {
    if (closedByUs) return;
    reconnectTimer = setTimeout(connectWebSocket, 2000);
  };
}

function setTimer(diff: number) {
  if (diff < 0) {
    roundTimer.value = "--:--";
    return;
  }

  const minutes = String(Math.floor(diff / 60000)).padStart(2, "0");
  const seconds = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
  roundTimer.value = `${minutes}:${seconds}`;
}

async function setUpTimer() {
  try {
    const state = await $fetch<RoundData>(`/api/game/${code}/round`, {
      method: "GET",
    });
    applyRoundState(state);
  } catch (error: any) {
    console.error("Error fetching game data:", error);
  }
}

onMounted(async () => {
  await connectWebSocket();
  sidebarQuery = window.matchMedia("(min-width: 1668px)");
  gridQuery = window.matchMedia("(min-width: 960px)");

  syncSidebarDefaults();
  syncOverviewGrid();

  sidebarQuery.addEventListener("change", syncSidebarDefaults);
  gridQuery.addEventListener("change", syncOverviewGrid);
});

onBeforeUnmount(() => {
  // Disconnect WebSocket on component unmount
  closedByUs = true;
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (timerId !== undefined) clearInterval(timerId);
  socket?.close();
});

watch(
  [leftOpen, rightOpen],
  async ([left, right]) => {
    await nextTick();

    const panels = splitter.value?.panelsRef;
    if (!panels) return;

    if (left) panels[0]?.expand();
    else panels[0]?.collapse();

    if (right) panels[2]?.expand();
    else panels[2]?.collapse();
  },
  { flush: "post", immediate: true },
);

const splitterItems: SplitterItem[] = [
  {
    id: "game-left",
    slot: "left",
    defaultSize: 15,
    minSize: 0,
    maxSize: 15,
    collapsible: true,
    collapsedSize: 0,
  },
  {
    id: "game-main",
    slot: "main",
    defaultSize: 70,
    minSize: 50,
    maxSize: 100,
    class: "min-w-0",
  },
  {
    id: "game-right",
    slot: "right",
    defaultSize: 15,
    minSize: 0,
    maxSize: 15,
    collapsible: true,
    collapsedSize: 0,
  },
];

const tabsItems: TabsItem[] = [
  { label: "Overview", value: "overview" },
  { label: "Statistics", value: "statistics" },
  { label: "Finance", value: "finance" },
  { label: "Sales", value: "sales" },
  { label: "Development", value: "development" },
];
</script>

<style lang="css" scoped>
.mobile-sidebar-toggle {
  position: fixed;
  top: 50%;
  z-index: 50;
  transform: translateY(-50%);
}

.mobile-sidebar-toggle--left {
  left: 0.5rem;
}

.mobile-sidebar-toggle--right {
  right: 0.5rem;
}

@media (min-width: 640px) {
  .mobile-sidebar-toggle {
    display: none;
  }
}
</style>
