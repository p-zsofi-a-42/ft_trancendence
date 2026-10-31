<script setup lang="ts">
defineProps<{
  label: string;
  name: string;
  required: boolean;
}>();

const color = defineModel<string>({ required: true });
</script>

<template>
  <UFormField
    :label="label"
    :name="name"
    :required="required"
    :ui="{ root: 'pb-3 items-center', error: 'hidden' }"
  >
    <UPopover>
      <UButton color="neutral" variant="outline">
        <span
          class="size-4 rounded-full border border-default"
          :style="{ backgroundColor: color }"
        />
        {{ color }}
      </UButton>

      <template #content>
        <UColorPicker v-model="color" class="p-2" />
      </template>
    </UPopover>
  </UFormField>
</template>
