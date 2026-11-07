<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    label: string;
    name: string;
    required?: boolean;
  }>(),
  { required: false },
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
    <UInput v-model="draft" type="number" step="1" class="w-full" />
  </UFormField>
</template>
