<template>
  <div class="fixed bottom-0 right-0 z-50 w-80 max-w-[calc(100vw-2rem)]">
    <UAccordion
      :items="items"
      :ui="{
        root: 'rounded-tl-2xl bg-app-background shadow-lg',
        trigger: 'px-4 py-3',
        content: 'border-t border-accented',
        body: 'p-4',
      }"
    >
      <template #messages>
        <div class="mx-h-96 overflow-y-auto">
          <FriendList />
        </div>
      </template>
    </UAccordion>
  </div>
</template>

<script setup lang="ts">
import FriendList from "./FriendList.vue";

const items = [{ label: "Messages", value: "messages", slot: "messages" }];
</script>
