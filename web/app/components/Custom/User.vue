<script setup lang="ts" generic="T extends UserSummary">
import type { UserSummary } from "~~/shared/types/friends";

const props = defineProps<{
  user: T;
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
    :name="user.name"
    :size="size"
    chip
    :avatar="{
      loading: 'lazy',
      icon: 'i-lucide-user',
    }"
  />
</template>
