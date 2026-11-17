<script setup lang="ts">
import type { Foyer } from "#shared/types/game";

type State = "creation" | "setup" | "game";

const state = ref<State>("creation");
const foyer = ref<Foyer>({
  name: "",
  companyCount: 3,
});

function createFoyer(details: Foyer) {
  foyer.value = details;
  state.value = "setup";
}

function startGame() {
  state.value = "game";
}

const foyerCode = ref("ABC123");
</script>

<template>
  <FoyerCreation />

</template>
