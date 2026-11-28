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

const { user: me } = useUserSession();
const avatarVersion = useAvatarVersion();
const avatarSrc = computed(() => {
  const isMe = String(me.value?.id) === String(props.user.id);
  return `/api/users/${props.user.id}/avatar?v=${isMe ? avatarVersion.value : 0}`;
});
</script>

<template>
  <UUser
    :name="user.name"
    :size="size"
    :avatar="{
      src: avatarSrc,
      loading: 'lazy',
      icon: 'i-myOwn-user',
    }"
  />
</template>
