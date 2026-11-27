<script setup lang="ts">
const props = defineProps<{
  error: string | boolean | undefined;
  errorSide?: "right" | "left" | "top" | "bottom";
}>();
</script>

<template>
  <UTooltip
    :text="typeof props.error === 'string' ? props.error : 'Required'"
    :open="Boolean(props.error)"
    :disabled="!props.error"
    :arrow="true"
    :ui="{
      text: 'text-error',
      content: 'bg-bg-elevated',
      arrow: 'fill-bg-elevated',
    }"
    :content="{ side: props.errorSide ?? 'right' }"
  >
    <slot />
  </UTooltip>
</template>
