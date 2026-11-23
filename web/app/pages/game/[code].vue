<!-- SETUP AND GAME PAGE -->

<!-- HTML CONTENT -->
<template>
  <div class="h-[90vh] w-full">
    <USplitter id="game-layout" :items="splitterItems">
      <template #left>
        <USidebar :items="tabsItems" />
        <!--         <aside class="h-full overflow-y-auto p-3">
          <UTabs
            v-model="activeTab"
            :items="tabsItems"
            orientation="vertical"
            :content="false"
            size="xl"
          />
        </aside> -->
      </template>

      <template #main>
        <main
          class="flex h-full w-full min-w-0 flex-col gap-4 overflow-auto px-4"
        >
          <header
            class="rounded-2xl h-14 border-4 border-primary bg-neutral-900 text-center mb-6"
          >
            <div
              class="border-b-4 border-x-4 border-primary rounded-b-2xl text-center justify-center items-center w-fit p-2 mx-auto inset-1 z-10 bg-neutral-900 text-white"
            >
              <h1 class="text-3xl font-bold">60:00</h1>
              <p>4 / 12</p>
            </div>
          </header>

          <section class="min-h-0 flex-1 rounded-2xl bg-neutral-900 p-4">
            <GameViewOverview v-if="activeTab === 'overview'" />
            <GameViewStatistics v-if="activeTab === 'statistics'" />
            <GameViewFinance v-if="activeTab === 'finance'" />
            <GameViewSales v-if="activeTab === 'sales'" />
            <GameViewDevelopment v-if="activeTab === 'development'" />
          </section>
        </main>
      </template>
    </USplitter>
  </div>
</template>

<!-- LOGIC -->
<script setup lang="ts">
import type { SplitterItem, TabsItem } from "@nuxt/ui";

type GameTab = "overview" | "statistics" | "finance" | "sales" | "development";

const code = useRoute().params.code as string;
const activeTab = ref<GameTab>("overview");

const splitterItems: SplitterItem[] = [
  {
    id: "game-left",
    slot: "left",
    defaultSize: 15,
    minSize: 10,
    maxSize: 15,
    class: "bg-neutral-900 text-white my-0 h-full rounded-r-2xl",
  },
  {
    id: "game-main",
    slot: "main",
    defaultSize: 70,
    minSize: 50,
    class: "min-w-0",
  },
  {
    id: "game-right",
    slot: "right",
    defaultSize: 15,
    minSize: 10,
    maxSize: 15,
    class: "bg-neutral-900 text-white my-0 h-full rounded-l-2xl",
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
