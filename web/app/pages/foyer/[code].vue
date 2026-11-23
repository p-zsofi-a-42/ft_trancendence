<template>
  <UContainer class="flex flex-col h-9/10 w-3/4 min-w-dvh">
    <UStepper
      ref="stepper"
      v-model="activeStep"
      :disabled="true"
      :items="stepper_items"
      :ui="{
        root: 'w-full flex-1 min-h-0 bg-neutral-900 border-8 border-neutral-900 rounded-2xl p-4',
        icon: 'bg-neutral-50',
        content: 'w-full flex-1 min-h-0',
      }"
    >
      <template #content="{ item }">
        <div class="flex h-full flex-col">
          <div class="min-h-0 flex-1">
            <FoyerOverview
              v-if="item?.value === 'overview'"
              :game-code="gameCode"
              :players="players"
              :companies="companies"
              v-model="settings"
              @continue="stepper?.next()"
            />

            <FoyerCompany
              v-else-if="item?.value === 'company-setup'"
              v-model="companies"
            />
            <UCard
              v-else-if="item?.value === 'game-start'"
              variant="outline"
              title="Game starts in"
              :ui="{
                root: 'h-full w-full items-center justify-center',
                title: 'text-2xl',
                body: 'text-4xl text-white text-center',
              }"
            >
              3
            </UCard>
          </div>
          <div v-if="stepper?.hasNext" class="ml-auto flex p-4 pt-0">
            <UButton
              class="mx-3 bg-red-500 text-white disabled:opacity-0 hover:bg-red-500/50"
              size="xl"
              variant="foyer"
              :disabled="!stepper?.hasPrev"
              @click="stepper?.prev()"
            >
              Back
            </UButton>
            <UButton
              class="disabled:opacity-0"
              size="xl"
              variant="foyer"
              :disabled="!stepper?.hasNext"
              @click="
                activeStep === 'overview'
                  ? stepper?.next()
                  : navigateTo(`/game/${gameCode}`)
              "
            >
              {{ activeStep === "overview" ? "Next" : "Start" }}
            </UButton>
          </div>
        </div>
      </template>
    </UStepper>
  </UContainer>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { StepperItem } from "@nuxt/ui";
import type { UserSummary } from "#imports";

const route = useRoute();
const { user } = useUserSession();
const gameCode: string = String(route.params.code);

let settings = ref<Game>(
  await $fetch(`/api/game/${gameCode}`, { method: "GET" }),
);

const { data: companies } = await useFetch<Company[]>(
  () => `/api/foyer/${gameCode}/companies`,
  { default: () => [] },
);

const players = computed<UserSummary[]>(() => {
  const playersById = new Map<string, UserSummary>();

  for (const company of companies.value) {
    const id = String(company.userId);

    playersById.set(id, {
      id,
      name:
        id === String(user.value?.id)
          ? (user.value?.name ?? `Player ${id}`)
          : `Player ${id}`,
    });
  }

  return [...playersById.values()];
});

const stepper_items = ref<StepperItem[]>([
  {
    title: "Foyer Setup",
    value: "overview",
    icon: "i-lucide-users",
  },
  {
    title: "Company Setup",
    value: "company-setup",
    icon: "i-lucide-building-complex",
  },
  {
    title: "Game Start",
    value: "game-start",
    icon: "i-lucide-gamepad-2",
  },
]);
const stepper = useTemplateRef("stepper");
const activeStep = ref("overview");
</script>
