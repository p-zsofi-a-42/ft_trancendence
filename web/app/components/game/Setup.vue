<script setup lang="ts">
import type { StepperItem } from "@nuxt/ui";
import type { Company, Foyer } from "#shared/types/game";

const foyer = defineModel<Foyer>("foyer", { required: true });

const company = ref<Company>({
  name: "",
  color: "#3b82fd",
});

const props = defineProps<{
  foyerCode: string;
}>();

const stepper_items = ref<StepperItem[]>([
  {
    title: "Foyer Setup",
    slot: "overview",
    icon: "i-lucide-users",
  },
  {
    title: "Company Setup",
    slot: "company-setup",
    icon: "i-lucide-building-complex",
  },
  {
    title: "Game Start",
    slot: "game-start",
    icon: "i-lucide-gamepad-2",
  },
]);

const stepper = useTemplateRef("stepper");
</script>

<template>
  <UCard
    :ui="{
      root: 'flex flex-col h-3/4 w-3/4 min-w-dvh p-2',
      body: 'flex flex-1 min-h-0',
    }"
  >
    <div class="flex flex-1 min-h-0 flex-col">
      <UStepper
        ref="stepper"
        :disabled="true"
        :items="stepper_items"
        :ui="{
          root: 'w-full flex-1 min-h-0',
          content: 'w-full flex-1 min-h-0',
        }"
      >
        <template #overview>
          <GameSetupOverview
            v-model:foyer="foyer"
            :foyer-code="props.foyerCode"
            @continue="stepper?.next()"
          />
        </template>
        <template #company-setup>
          <GameSetupCompany v-model:company="company" />
        </template>
        <template #game-start>
          <UCard
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
        </template>
      </UStepper>
      <div v-if="stepper?.hasNext" class="ml-auto flex">
        <UButton
          class="mx-3 bg-red-500 text-white disabled:opacity-0"
          :disabled="!stepper?.hasPrev"
          size="xl"
          variant="foyer"
          @click="stepper?.prev()"
        >
          Back
        </UButton>
        <UButton
          class="text-white disabled:opacity-0"
          size="xl"
          variant="foyer"
          :disabled="!stepper?.hasNext"
          @click="stepper?.next()"
        >
          {{ stepper?.hasPrev ? "Start" : "Next" }}
        </UButton>
      </div>
    </div>
  </UCard>
</template>
