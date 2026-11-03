<script setup lang="ts">
import type { SplitterItem } from "@nuxt/ui";
import type { ListboxItem } from "@nuxt/ui";
import type { Company } from "#shared/types/game";

const company = defineModel<Company>("company", { required: true });

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

const emit = defineEmits<{
  continue: [];
}>();
</script>

<template>
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
          v-model="company.name"
          label="Name"
          name="name"
          required
        />
        <FormFieldColor
          v-model="company.color"
          label="Color"
          name="color"
          required
        />
      </UCard>
    </template>
  </USplitter>
</template>
