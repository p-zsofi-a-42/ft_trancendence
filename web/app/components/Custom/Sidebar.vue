<template>
  <USidebar
    v-model:open="isOpen"
    :title="title"
    :side="side"
    breakpoint="sm"
    :rail="!props.isWide"
    :close-icon="iconClose"
    :ui="{
      wrapper: 'pt-2',
      title: 'my-4 text-2xl text-center',
      container:
        'top-(--ui-header-height) bottom-0 h-[calc(100%-var(--ui-header-height))] border-0',
      inner: 'bg-app-background rounded-l-2xl my-4',
    }"
  >
    <template #rail="{ ui }">
      <UButton
        :icon="isOpen ? iconClose : iconOpen"
        :aria-label="
          isOpen ? `Close ${title} sidebar` : `Open ${title} sidebar`
        "
        :aria-expanded="isOpen"
        :class="
          ui.rail({
            class:
              'w-8 after:hidden hover:bg-transparent active:bg-transparent',
          })
        "
        :style="
          side === 'right'
            ? { insetInlineStart: '1px', translate: '-100% 0' }
            : { insetInlineEnd: '10px', translate: '100% 0' }
        "
        color="neutral"
        variant="ghost"
        size="xl"
        @click="isOpen = !isOpen"
      />
    </template>
    <slot default />
  </USidebar>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

const props = defineProps<{
  title?: string;
  side?: "left" | "right";
  isWide: boolean;
}>();

const isOpen = defineModel<boolean>("isOpen", { required: true });

const iconClose =
  props.side === "left"
    ? "i-lucide-panel-left-close"
    : "i-lucide-panel-right-close";
const iconOpen =
  props.side === "left"
    ? "i-lucide-panel-left-open"
    : "i-lucide-panel-left-open";

let widthQuery: MediaQueryList | undefined;

function syncSidebarDefaults() {
  const wide = widthQuery?.matches ?? false;

  isOpen.value = wide;
}

onMounted(() => {
  widthQuery = window.matchMedia("(min-width: 1600px)");
  syncSidebarDefaults();
  widthQuery.addEventListener("change", syncSidebarDefaults);
});

onBeforeUnmount(() => {
  widthQuery?.removeEventListener("change", syncSidebarDefaults);
});
</script>

<style lang="css" scoped>
.mobile-sidebar-toggle {
  position: fixed;
  top: 50%;
  z-index: 50;
  transform: translateY(-50%);
}

.mobile-sidebar-toggle--left {
  left: 0.5rem;
}

.mobile-sidebar-toggle--right {
  right: 0.5rem;
}

@media (min-width: 640px) {
  .mobile-sidebar-toggle {
    display: none;
  }
}
</style>
