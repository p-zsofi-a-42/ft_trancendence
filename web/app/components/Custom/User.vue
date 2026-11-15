<script setup lang="ts">
import type { UserSummary } from "~~/shared/types/friends";

const props = defineProps<{
  user: UserSummary | null;
  size?:
    | "2xl"
    | "md"
    | "3xs"
    | "2xs"
    | "xs"
    | "sm"
    | "lg"
    | "xl"
    | "3xl"
    | undefined;
}>();
</script>

<template>
  <UUser
    :name="user?.name ?? 'Guest'"
    :size="size"
    chip
    :avatar="{
      loading: 'lazy',
      icon: 'i-lucide-user',
    }"
  />
</template>
