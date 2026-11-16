<script setup lang="ts">
import { useClipboard } from "@vueuse/core";

const { copy, copied } = useClipboard();

const props = defineProps<{
  text: string;
}>();
</script>

<template>
  <UInput
    :model-value="text"
    :ui="{ root: 'w-full', trailing: 'pr-0.5' }"
    readonly
  >
    <template #trailing>
      <UTooltip text="Copy to clipboard" :content="{ side: 'right' }">
        <UButton
          :color="copied ? 'success' : 'neutral'"
          variant="link"
          size="sm"
          :icon="copied ? 'i-lucide-copy-check' : 'i-lucide-copy'"
          aria-label="Copy to clipboard"
          @click="copy(text)"
        />
      </UTooltip>
    </template>
  </UInput>
</template>
