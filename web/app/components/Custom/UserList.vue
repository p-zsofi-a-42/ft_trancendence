<script setup lang="ts" generic="T extends UserSummary">
import type { UserSummary } from "~~/shared/types/friends";

const { onlineIds } = usePresence();

const props = defineProps<{
  list: T[];
}>();
</script>

<template>
  <ul>
    <li
      v-for="user in list"
      :key="user.id"
      class="border rounded-xl p-2 mb-1 flex"
    >
      <CustomUser :user="user" />
      <!-- Show green dot if online: change to be on profile picture-->
      <span
        v-if="onlineIds.includes(user.id)"
        class="ml-2 size-2 self-center rounded-full bg-green-500"
        aria-label="online"
      />
      <div class="ml-auto flex gap-2">
        <slot name="trailing" :user="user" />
      </div>
    </li>
  </ul>
</template>
