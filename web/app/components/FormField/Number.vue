<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    label: string;
    name: string;
    required?: boolean;
    slider?: boolean;
    min?: number;
    max?: number;
    default?: number;
  }>(),
  { required: false, slider: false, min: 0, max: 50, default: 3 },
);

const model = defineModel<number>({ required: true });
const draft = ref(String(model.value));

watch(model, (value) => {
  draft.value = String(value);
});

watch(draft, (value) => {
  if (value.trim() === "") return;

  const number = Number(value);
  if (Number.isInteger(number)) {
    model.value = number;
  }
});
</script>

<template>
  <UFormField
    :label="props.label"
    :name="props.name"
    :required="props.required"
  >
    <div v-if="slider">
      <USlider
        v-model="model"
        :default-value="default"
        :step="1"
        :min="min"
        :max="max"
      />
      <div class="flex justify-between text-sm text-muted select-none mt-1.5">
        <span v-for="n in max - min + 1">{{ n + min - 1 }}</span>
      </div>
    </div>

    <UInput v-else v-model="draft" type="number" step="1" class="w-full" />
  </UFormField>
</template>
