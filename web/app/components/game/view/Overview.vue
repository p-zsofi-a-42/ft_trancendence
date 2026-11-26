<template>
  <div
    class="grid w-full h-full gap-4"
    :class="resize ? 'grid-cols-1' : 'grid-cols-2'"
  >
    <UCard title="Statistics" variant="subtle" class="w-full text-white">
      More Info ...
    </UCard>
    <UCard title="Finance" variant="subtle" class="w-full text-white">
      More Info ...
    </UCard>
    <UCard title="Sales" variant="subtle" class="w-full text-white">
      More Info ...
    </UCard>
    <UCard title="Development" variant="subtle" class="w-full text-white">
      More Info ...
    </UCard>
  </div>
</template>

<script setup lang="ts">
defineProps<{ resize: boolean }>();
</script>
