<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    name: string;
    label?: string;
    required?: boolean;
    placeholder?: string;
    orientation?: "horizontal" | "vertical";
  }>(),
  { required: false },
);

const model = defineModel<string>({ required: true });
</script>

<template>
  <UFormField
    :label="label"
    :name="name"
    :required="required"
    :orientation="orientation"
    :ui="{ root: 'pb-3 items-center', error: 'hidden' }"
  >
    <template #default="{ error }">
      <UTooltip
        :text="typeof error === 'string' ? error : 'Required'"
        :open="Boolean(error)"
        :disabled="!error"
        :arrow="true"
        :ui="{ text: 'text-error' }"
        :content="{ side: 'right' }"
      >
        <UInput v-model="model" :placeholder="placeholder" class="w-full" />
      </UTooltip>
    </template>
  </UFormField>
</template>
