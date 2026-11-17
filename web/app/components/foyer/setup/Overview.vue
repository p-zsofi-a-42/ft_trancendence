<script setup lang="ts">
import type { FormError, FormSubmitEvent, SplitterItem } from "@nuxt/ui";
import type { Foyer } from "#shared/types/game";
import { set } from "@nuxt/ui/runtime/utils/index.js";

// FETCH FRIENDS LIST
const { data } = useFetch<FriendEntry[]>("/api/friends", {
  key: "friends-list",
  default: () => [],
});

const friends = computed(() =>
  (data.value ?? []).filter((f) => f.friendship === "friends"),
); // Friends list

const players: UserSummary[] = [];

interface GameSettingsDraft {
  cityName: string;
  companyCount: number;
  startingCapital: number;
  rountCount: number;
}

const settings = reactive<GameSettingsDraft>({
  cityName: "",
  companyCount: 3,
  startingCapital: 100_000,
  rountCount: 12,
});

const props = defineProps<{
  foyerCode: string;
}>();

const toast = useToast();

function validateSettings(values: Partial<GameSettingsDraft>): FormError[] {
  const errors: FormError[] = [];

  if (!values.cityName?.trim())
    errors.push({ name: "name", message: "Required" });

  if (
    typeof values.companyCount !== "number" ||
    !Number.isInteger(values.companyCount) ||
    values.companyCount < 1 ||
    values.companyCount > 5
  )
    errors.push({
      name: "companyCount",
      message: "Choose a value from 1 to 5",
    });

  return errors;
}

function saveSettings(event: FormSubmitEvent<GameSettingsDraft>) {
  const settings = { ...event.data };
  console.log("Overview settings ready to save:", settings);

  toast.add({
    title: "Settings saved",
    description: "The Game settings have been saved.",
  });
}

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
        <UForm
          class="flex flex-col gap-4"
          id="foyer-settings-form"
          :state="settings"
          :validate="validateSettings"
          @submit="saveSettings"
        >
          <FormFieldString
            v-model="settings.cityName"
            label="City Name"
            name="name"
            placeholder="Baguette City"
            required
          />

          <FormFieldNumber
            v-model="settings.companyCount"
            label="Number of companies"
            name="companyCount"
            slider
            :min="1"
            :max="5"
            required
          />

          <FormFieldNumber
            v-model="settings.startingCapital"
            label="Starting capital"
            name="startingCapital"
            :min="1"
            required
          />

          <FormFieldNumber
            v-model="settings.rountCount"
            label="Number of rounds"
            name="roundCount"
            :min="1"
            required
          />
        </UForm>
        <template #footer>
          <div class="flex justify-center">
            <UButton
              form="foyer-settings-form"
              type="submit"
              size="lg"
              variant="foyer"
              class="text-white"
            >
              Save
            </UButton>
          </div>
        </template>
      </UCard>
    </template>

    <template #players>
      <UCard
        title="Players"
        variant="foyer"
        :ui="{ body: 'text-center', header: 'border-b-2 border-neutral-600' }"
      >
        <CustomUserList :list="players" />
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
          <CustomCopyField :text="foyerCode" label="Code" />
        </template>
      </UCard>
    </template>
  </USplitter>
</template>
