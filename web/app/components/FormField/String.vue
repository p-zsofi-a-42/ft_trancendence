<script setup lang="ts">
import InputErrorTT from "../Custom/InputErrorTT.vue";

const props = withDefaults(
  defineProps<{
    name: string;
    label?: string;
    required?: boolean;
    placeholder?: string;
    orientation?: "horizontal" | "vertical";
    inputUi?: Record<string, string>;
    errorSide?: "right" | "left" | "top" | "bottom";
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
    :ui="{ root: 'items-center', error: 'hidden' }"
  >
    <template #default="{ error }">
      <InputErrorTT :error="error">
        <UInput
          v-model="model"
          :placeholder="placeholder"
          class="w-full"
          :ui="inputUi"
        >
          <template #trailing>
            <slot name="input-trailing" />
          </template>
        </UInput>
      </InputErrorTT>
    </template>
  </UFormField>
</template>
