<script setup lang="ts">
import type { SplitterItem } from "@nuxt/ui";
import type { Foyer } from "#shared/types/game";
import { useClipboard } from "@vueuse/core";

const foyer = defineModel<Foyer>("foyer", { required: true });

const props = defineProps<{
  foyerCode: string;
}>();

const { copy, copied } = useClipboard();

const name = computed({
  get: () => foyer.value.name,
  set: (name: string) => {
    foyer.value = { ...foyer.value, name };
  },
});

const companyCount = computed({
  get: () => foyer.value.companyCount,
  set: (companyCount: number) => {
    foyer.value = { ...foyer.value, companyCount };
  },
});

const overviewItems: SplitterItem[] = [
  {
    slot: "config",
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

const emit = defineEmits<{
  continue: [];
}>();
</script>

<template>
  <USplitter
    :items="overviewItems"
    :ui="{
      root: 'w-full min-h-0 py-4',
      panel: 'h-full min-h-0',
    }"
  >
    <template #config>
      <UCard title="Foyer" variant="foyer">
        <UFormField label="Code" name="foyerCode">
          <UInput
            :model-value="props.foyerCode"
            :ui="{ trailing: 'pr-0.5' }"
            readonly
          >
            <UTooltip text="Copy to clipboard" :content="{ side: 'right' }">
              <UButton
                :color="copied ? 'success' : 'neutral'"
                variant="link"
                size="sm"
                :icon="copied ? 'i-lucide-copy-check' : 'i-lucide-copy'"
                aria-label="Copy to clipboard"
                @click="copy(props.foyerCode)"
              />
            </UTooltip>
          </UInput>
        </UFormField>
        <FormFieldString v-model="name" label="Name" name="name" />

        <FormFieldNumber
          v-model="companyCount"
          label="Number of companies"
          name="companyCount"
          type="number"
        />
      </UCard>
    </template>
    <template #players>
      <UListbox :items="[]" class="w-full" />
    </template>
    <template #invite>
      <UListbox :items="[]" class="w-full" />
    </template>
  </USplitter>
</template>
