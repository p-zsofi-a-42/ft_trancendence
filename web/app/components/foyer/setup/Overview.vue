<script setup lang="ts">
import type { FormError, FormSubmitEvent, SplitterItem } from "@nuxt/ui";
import type { Foyer } from "#shared/types/game";

// FETCH FRIENDS LIST
const { data } = useFetch<FriendEntry[]>("/api/friends", {
  key: "friends-list",
  default: () => [],
});

const friends = computed(() =>
  (data.value ?? []).filter((f) => f.friendship === "friends"),
); // Friends list

const players: UserSummary[] = [];

const foyer = defineModel<Foyer>("foyer", { required: true });

const props = defineProps<{
  foyerCode: string;
}>();

const toast = useToast();

function validateFoyer(values: Partial<Foyer>): FormError[] {
  const errors: FormError[] = [];
  const count = values.companyCount;

  if (!values.name?.trim()) errors.push({ name: "name", message: "Required" });

  if (
    typeof count !== "number" ||
    !Number.isInteger(count) ||
    count < 1 ||
    count > 5
  )
    errors.push({
      name: "companyCount",
      message: "Choose a value from 1 to 5",
    });

  return errors;
}

function saveSettings(event: FormSubmitEvent<Foyer>) {
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
          header: 'border-b-2 border-neutral-600',
          body: 'flex flex-col gap-2',
        }"
      >
        <UFormField label="Code">
          <CustomCopyField :text="foyerCode" label="Code" />
        </UFormField>
        <UForm
          id="foyer-settings-form"
          :state="foyer"
          :validate="validateFoyer"
          @submit="saveSettings"
        >
          <FormFieldString
            v-model="foyer.name"
            label="City Name"
            name="name"
            placeholder="Baguette City"
            required
          />

          <FormFieldNumber
            v-model="foyer.companyCount"
            label="Number of companies"
            name="companyCount"
            slider
            :min="1"
            :max="5"
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
        title="Friends"
        variant="foyer"
        :ui="{ body: 'text-center', header: 'border-b-2 border-neutral-600' }"
      >
        <CustomUserList :list="friends">
          <template #trailing>
            <UButton> Invite </UButton>
          </template>
        </CustomUserList>
        <p v-if="!friends.length">No Friends :(</p>
      </UCard>
    </template>
  </USplitter>
</template>
