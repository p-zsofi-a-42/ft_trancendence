<template>
  <UCard
    title="Players"
    variant="foyer"
    :ui="{
      body: 'text-center',
      header: 'border-b-2 border-border-accented',
    }"
  >
    <CustomUserList
      :list="players.map((player: Player) => player.user)"
      :capacity="nPlayers"
    />

    <p v-if="!players.length">No Players</p>
  </UCard>
</template>

<script setup lang="ts">
import type { Player } from "#shared/types/game";

defineProps<{
  players: Player[];
  nPlayers: number;
}>();
</script>
