<script setup lang="ts">
import type { SplitterItem } from "@nuxt/ui";

withDefaults(
  defineProps<{
    id: string;
    items: SplitterItem[];
    orientation: "horizontal" | "vertical";
  }>(),
  { orientation: "horizontal" },
);
</script>

<template>
  <USplitter
    :id="id"
    :items="items"
    :orientation="orientation"
    :ui="{
      root: 'w-full h-full min-h-0',
      panel: 'h-full min-h-0 justify-center',
    }"
  >
    <template v-for="item in items" #[item.slot]>
      <slot :name="item.slot" />
    </template>
  </USplitter>
</template>
