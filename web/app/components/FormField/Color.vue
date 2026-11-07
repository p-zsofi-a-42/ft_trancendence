<script setup lang="ts">
const props = defineProps<{
  label: string;
  name: string;
}>();

const model = defineModel<string>({ required: true });
</script>

<template>
  <UFormField
    :label="label"
    :name="name"
    :ui="{ root: 'pb-3 items-center', error: 'hidden' }"
  >
    <UPopover>
      <UButton color="neutral" variant="outline">
        <span
          class="size-4 rounded-full border border-default"
          :style="{ backgroundColor: model }"
        />
        {{ model }}
      </UButton>

      <template #content>
        <UColorPicker v-model="model" class="p-2" />
      </template>
    </UPopover>
  </UFormField>
</template>
