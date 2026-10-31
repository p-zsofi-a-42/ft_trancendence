<script setup lang="ts">
import type { StepperItem } from "@nuxt/ui";
import type { Foyer } from "#shared/types/game";

const foyer = defineModel<Foyer>("foyer", { required: true });

const props = defineProps<{
  foyerCode: string;
}>();

const stepper_items = ref<StepperItem[]>([
  {
    title: "Foyer",
    slot: "overview",
  },
  {
    title: "Company Setup",
    slot: "company-setup",
  },
  {
    title: "Game Start",
    slot: "game-start",
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
        <GameSetupCompany @continue="stepper?.next()" />
      </template>
      <template #game-start> Game Start </template>
    </UStepper>
  </UCard>
</template>
