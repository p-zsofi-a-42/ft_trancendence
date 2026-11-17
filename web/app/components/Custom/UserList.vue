<script setup lang="ts" generic="T extends UserSummary">
import type { UserSummary } from "~~/shared/types/friends";

const props = defineProps<{
  list: T[];
}>();
</script>

<template>
  <ul>
    <li
      v-for="user in list"
      :key="user.id"
      class="border border-neutral-800 bg-neutral-900 rounded-xl p-2 mb-1 flex"
    >
      <CustomUser :user="user" />
      <div class="ml-auto flex gap-2">
        <slot name="trailing" :user="user" />
      </div>
    </li>
  </ul>
</template>
