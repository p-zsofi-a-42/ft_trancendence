<script setup lang="ts">
import type { SplitterItem } from "@nuxt/ui";
import type { ListboxItem } from "@nuxt/ui";
import type { Company } from "#shared/types/game";

const state = reactive<Company>({
  name: "",
  color: "#3b82f6",
});

const companyViewItems: SplitterItem[] = [
  {
    slot: "preview",
    minSize: 30,
    defaultSize: 50,
  },
  {
    slot: "config",
    minSize: 30,
    defaultSize: 50,
  },
];

const companyConfigItems = computed<ListboxItem[]>(() => [
  {
    label: `Company Name: `,
    value: "company-name",
    disabled: true,
  },
]);

const rows: SplitterItem[] = [
  { slot: "top", minSize: 20, defaultSize: 50 },
  { slot: "bottom", minSize: 20, defaultSize: 50 },
];

const emit = defineEmits<{
  continue: [];
}>();
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <USplitter
      :items="companyViewItems"
      :ui="{
        root: 'w-full h-full min-h-0',
        panel: 'h-full min-h-0 p-0 justify-center',
      }"
    >
      <template #preview>
        <UCard title="Preview" variant="foyer" />
      </template>
      <template #config>
        <UCard title="Company Config" variant="foyer">
          <FormFieldString
            v-model="state.name"
            label="Name"
            name="name"
            required
          />
          <FormFieldColor
            v-model="state.color"
            label="Color"
            name="color"
            required
          />
        </UCard>
      </template>
    </USplitter>
    <UButton class="shrink-0 ml-auto" variant="foyer" @click="emit('continue')">
      Continue
    </UButton>
  </div>
</template>
