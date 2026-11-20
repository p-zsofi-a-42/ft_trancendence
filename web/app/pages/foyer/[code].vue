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
            <FoyerSetupOverview
              v-if="item?.value === 'overview'"
              :game-code="gameCode"
              @continue="stepper?.next()"
            />

            <FoyerSetupCompany v-else-if="item?.value === 'company-setup'" />
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
              :type="activeStep === 'overview' ? 'submit' : 'button'"
              :form="
                activeStep === 'overview' ? 'foyer-settings-form' : undefined
              "
              :disabled="!stepper?.hasNext"
              :loading="isLoading"
            >
              {{ !stepper?.hasNext ? "Start" : "Next" }}
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

const route = useRoute();

// Den dynamischen Parameter [code] aus der URL auslesen
const gameCode = route.params.code;

const isLoading = ref(false);

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

const activeStep = ref("overview");
const stepper = useTemplateRef("stepper");
</script>
