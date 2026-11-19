<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    label: string;
    name: string;
    required?: boolean;
    slider?: boolean;
    min?: number;
    max?: number;
    step?: number;
    default?: number;
  }>(),
  { required: false, slider: false, min: 0, max: 50, step: 1, default: 3 },
);

const model = defineModel<number>({ required: true });
</script>

<template>
  <UFormField
    :label="props.label"
    :name="props.name"
    :required="props.required"
    :ui="{ error: 'hidden' }"
  >
    <template #default="{ error }">
      <CustomInputErrorTT :error="error">
        <div v-if="props.slider">
          <USlider
            v-model="model"
            :default-value="props.default"
            :step="props.step"
            :min="props.min"
            :max="props.max"
            class="mt-3"
          />
          <div
            class="flex justify-between text-sm text-muted select-none mt-1.5 mx-1.25"
          >
            <span v-for="n in props.max - props.min + 1" :key="n">
              {{ n + props.min - 1 }}
            </span>
          </div>
        </div>
        <UInputNumber
          v-else
          v-model="model"
          :min="props.min"
          :max="props.max"
          :step="props.step"
          :step-snapping="false"
          allow-invalid
          class="w-full"
        />
      </CustomInputErrorTT>
    </template>
  </UFormField>
</template>
