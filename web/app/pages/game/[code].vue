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
            class="rounded-2xl h-14 border-4 border-primary bg-neutral-900 text-center mb-4"
          >
            <div
              class="border-b-4 border-x-4 border-primary rounded-b-2xl text-center justify-center items-center w-40 p-2 mx-auto inset-1 z-10 bg-app-background"
            >
              <h1 class="text-3xl font-bold">{{ roundTimer }}</h1>
              <p>{{ currentRound }} / {{ maxRounds }}</p>
            </div>
          </header>

          <section class="min-h-0 flex-1 rounded-2xl bg-neutral-900 p-4">
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
import type { Game, Company, Round, RoundResult } from "#shared/types/game";
import type { SplitterItem, TabsItem } from "@nuxt/ui";
import { nextTick, useTemplateRef, watch } from "vue";
  
definePageMeta({ middleware: "auth" });

let roundTimer = ref("00:00");
let currentRound = ref(4);
let maxRounds = ref(12);

const isWide = ref(false);
const leftOpen = ref(false);
const rightOpen = ref(false);
const overviewResize = ref(true);
const splitter = useTemplateRef("gameSplitter");

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

onMounted(() => {
  sidebarQuery = window.matchMedia("(min-width: 1668px)");
  gridQuery = window.matchMedia("(min-width: 960px)");

  syncSidebarDefaults();
  syncOverviewGrid();

  sidebarQuery.addEventListener("change", syncSidebarDefaults);
  gridQuery.addEventListener("change", syncOverviewGrid);
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

type GameTab = "overview" | "statistics" | "finance" | "sales" | "development";
const activeTab = ref<GameTab>("overview");

const code = useRoute().params.code as string;

// TODO: provisional redirect
try {
  const { loggedIn, user } = useUserSession();
  console.log("User session:", JSON.stringify(user.value));
  const game = await $fetch<Game>(`/api/game/${code}`, { method: "GET" });
  console.log("Game data:", JSON.stringify(game));
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
