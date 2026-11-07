<script setup lang="ts">
import type { FormError, FormSubmitEvent } from "@nuxt/ui";
import type { SplitterItem } from "@nuxt/ui";
import type { Company } from "#shared/types/game";

const company = reactive<Company>({
  name: "",
  color: "#ffffff",
});

function validate(state: Partial<Company>): FormError[] {
  const errors: FormError[] = [];

  if (!state.name?.trim()) errors.push({ name: "name", message: "Required" });

  return errors;
}

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
  start: [];
}>();

async function submit(event: FormSubmitEvent<Company>) {
  emit("start");
}
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
        <UForm :state="company" :validate="validate" @submit="submit">
          <FormFieldString
            v-model="company.name"
            label="Name"
            name="name"
            required
          />
          <FormFieldColor v-model="company.color" label="Color" name="color" />
        </UForm>
      </UCard>
    </template>
  </USplitter>
</template>
