<script setup lang="ts">
import InputErrorTT from "../Custom/InputErrorTT.vue";

const props = withDefaults(
  defineProps<{
    label: string;
    name: string;
    colors: string[];
    required?: boolean;
  }>(),
  { required: true },
);

const model = defineModel<string | undefined>({ required: true });

const colorClasses: Record<string, string> = {
  red: "bg-red-500",
  blue: "bg-blue-500",
  green: "bg-green-500",
  yellow: "bg-yellow-500",
  purple: "bg-purple-500",
};
</script>

<template>
  <UFormField
    :label="props.label"
    :name="props.name"
    :required="props.required"
    :ui="{ label: 'mb-2', error: 'hidden' }"
  >
    <template #default="{ error }">
      <InputErrorTT :error="error">
        <fieldset class="flex flex-wrap gap-3">
          <label
            v-for="color in props.colors"
            :key="color"
            class="cursor-pointer"
          >
            <input
              v-model="model"
              class="sr-only"
              type="radio"
              :name="props.name"
              :value="color"
              :required="props.required"
            />
            <span
              class="block size-4 rounded-full border border-white/40 transition"
              :class="[
                colorClasses[color] ?? 'bg-neutral-500',
                model === color
                  ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-900 scale-110'
                  : 'opacity-70 hover:opacity-100',
              ]"
            />
            <span class="sr-only">{{ color }}</span>
          </label>
        </fieldset>
      </InputErrorTT>
    </template>
  </UFormField>
</template>
