<script setup lang="ts">
import { toDisplayString } from "vue";

defineProps<{
  label: string;
  name: string;
  type?: "text" | "number" | "color";
  required?: boolean;
}>();

const model = defineModel<string>({ required: true });
</script>

<template>
  <UFormField
    :label="label"
    :name="name"
    :required="required"
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
        <UInput v-model="model" :type="type ?? 'text'" class="w-full" />
      </UTooltip>
    </template>
  </UFormField>
</template>
