<template>
  <ul class="flex-1 min-h-0 overflow-y-auto">
    <li
      v-for="(item, index) in items"
      :key="item.key"
      class="border border-border-accented rounded-xl p-2 mb-1 flex"
    >
      <template v-if="item.user">
        <CustomUser :user="item.user" />
        <!-- Show green dot if online: change to be on profile picture-->
        <span
          v-if="onlineIds.includes(item.user.id)"
          class="ml-2 size-2 self-center rounded-full bg-green-500"
          aria-label="online"
        />
        <div class="ml-auto flex gap-2">
          <slot name="trailing" :user="item.user" />
        </div>
      </template>

      <slot v-else name="empty" :index="index">
        <div
          class="flex items-center gap-3"
          :aria-label="`Waiting for player ${index + 1}`"
        >
          <span class="sr-only">Waiting for player {{ index + 1 }}</span>
          <USkeleton class="size-8 rounded-full" aria-hidden="true" />
          <USkeleton class="h-4 w-28 rounded" aria-hidden="true" />
        </div>
      </slot>
    </li>
  </ul>
</template>

<script setup lang="ts" generic="T extends UserSummary">
import { computed } from "vue";
import type { UserSummary } from "#shared/types/friends";

const { onlineIds } = usePresence();

const props = defineProps<{
  list: T[];
  capacity?: number;
}>();

const items = computed(() => {
  const count = Math.max(
    props.capacity ?? props.list.length,
    props.list.length,
  );

  return Array.from({ length: count }, (_, index) => ({
    user: props.list[index] ?? null,
    key: props.list[index]?.id ?? `empty-${index}`,
  }));
});
</script>
