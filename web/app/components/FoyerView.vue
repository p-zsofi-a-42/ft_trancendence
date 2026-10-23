<script setup lang="ts">
  type Friend = {
    id: number
    name: string
    status: 'online' | 'offline'
    invited: boolean
    joined: boolean
  }

  defineProps<{
    foyer: {
      name: string
      companyCount: number
    }
    friends: Friend[]
  }>()

  const emit = defineEmits<{
    invite: [friendId: number]
    start: []
  }>()
</script>

<template>
  <section class="window">
    <div>
      <h3>Invite Friends</h3>
    </div>
    <UButton class="self-end" @click="emit('start')">
      Start Game
    </UButton>
  </section>
</template>