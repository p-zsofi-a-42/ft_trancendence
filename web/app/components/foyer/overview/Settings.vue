<template>
  <UCard
    title="Game Settings"
    variant="foyer"
    :ui="{
      root: 'flex h-full flex-col',
      header: 'border-b-2 border-neutral-600',
      body: 'flex flex-1 flex-col gap-2',
      footer: 'flex flex-col mx-auto',
    }"
  >
    <UForm
      id="foyer-settings-form"
      class="flex flex-col gap-4"
      :state="settingsModel"
      :schema="settingsSchema"
      @submit="submit"
    >
      <FormFieldNumber
        v-model="settingsModel.nPlayers"
        label="Number of Players"
        name="nPlayers"
        :min="limits.nPlayers.min"
        :max="limits.nPlayers.max"
        slider
        required
      />

      <FormFieldNumber
        v-model="settingsModel.nRounds"
        label="Number of rounds"
        name="nRounds"
        :min="limits.nRounds.min"
        :max="limits.nRounds.max"
        required
      />

      <FormFieldNumber
        v-model="settingsModel.seedCapital"
        label="Starting capital"
        name="seedCapital"
        :min="limits.seedCapital.min"
        :max="limits.seedCapital.max"
        :step="1_000"
        required
      />

      <FormFieldNumber
        v-model="settingsModel.minutesPerRound"
        label="Minutes per round"
        name="minutesPerRound"
        :min="limits.minutesPerRound.min"
        :max="limits.minutesPerRound.max"
        :step="1"
        required
      />
    </UForm>
    <template #footer>
      <UButton
        type="submit"
        form="foyer-settings-form"
        variant="foyer"
        size="xl"
        :disabled="!hasChanges"
      >
        Save
      </UButton>
    </template>
  </UCard>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import * as z from "zod";

const props = defineProps<{
  gameCode: string;
}>();

const settingsModel = defineModel<Game>({
  required: true,
});

type EditableSttings = Pick<
  Game,
  "nPlayers" | "nRounds" | "seedCapital" | "minutesPerRound"
>;

function getEditableSettings(game: Game): EditableSttings {
  return {
    nPlayers: game.nPlayers,
    nRounds: game.nRounds,
    seedCapital: game.seedCapital,
    minutesPerRound: game.minutesPerRound,
  };
}

const savedSettings = ref(getEditableSettings(settingsModel.value));

const hasChanges = computed(() => {
  const current = getEditableSettings(settingsModel.value);

  return (
    current.nPlayers !== savedSettings.value.nPlayers ||
    current.nRounds !== savedSettings.value.nRounds ||
    current.seedCapital !== savedSettings.value.seedCapital ||
    current.minutesPerRound !== savedSettings.value.minutesPerRound
  );
});

const limits = {
  nPlayers: { min: 1, max: 5 },
  nRounds: { min: 1, max: 34 },
  seedCapital: { min: 1, max: 1_000_000 },
  minutesPerRound: { min: 1, max: 60 },
};

const settingsSchema = z.object({
  nPlayers: z
    .number({ error: "Enter a valid number" })
    .int("Must be a whole number")
    .min(limits.nPlayers.min, "Choose a value from 1 to 5")
    .max(limits.nPlayers.max, "Choose a value from 1 to 5"),

  nRounds: z
    .number({ error: "Enter a valid number" })
    .int("Must be a whole number")
    .min(limits.nRounds.min, "Choose a value from 1 to 34")
    .max(limits.nRounds.max, "Choose a value from 1 to 34"),

  seedCapital: z
    .number({ error: "Enter a valid number" })
    .int("Must be a whole number")
    .min(limits.seedCapital.min, "Choose a value from 1 to 1.000.000")
    .max(limits.seedCapital.max, "Choose a value from 1 to 1.000.000"),

  minutesPerRound: z
    .number({ error: "Enter a valid number" })
    .int("Must be a whole number")
    .min(limits.minutesPerRound.min, "Choose a value from 1 to 60")
    .max(limits.minutesPerRound.max, "Choose a value from 1 to 60"),
});

async function submit(event: FormSubmitEvent<z.infer<typeof settingsSchema>>) {
  const updated = await $fetch<Game>(`/api/foyer/${props.gameCode}/update`, {
    method: "PATCH",
    body: event.data,
  });

  settingsModel.value = updated;
  savedSettings.value = getEditableSettings(updated);
}
</script>
