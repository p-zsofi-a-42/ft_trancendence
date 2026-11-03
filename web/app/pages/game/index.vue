<script setup lang="ts">
import type { Foyer } from "#shared/types/game";

type State = "creation" | "setup" | "game";

type Friend = {
  id: number;
  name: string;
  status: "online" | "offline";
  invited: boolean;
  joined: boolean;
};

const state = ref<State>("creation");
const foyer = ref<Foyer>({
  name: "",
  companyCount: 3,
});

const friends = ref<Friend[]>([
  { id: 1, name: "Alex", status: "online", invited: false, joined: false },
  { id: 2, name: "Sam", status: "offline", invited: false, joined: false },
]);

function createFoyer(details: Foyer) {
  foyer.value = details;
  state.value = "setup";
}

function inviteFriend(friendId: number) {
  friends.value = friends.value.map((friend) =>
    friend.id === friendId ? { ...friend, invited: true } : friend,
  );
}

function startGame() {
  state.value = "game";
}

const foyerCode = ref("ABC123");
</script>

<template>
  <GameCreation v-if="state === 'creation'" @create="createFoyer" />

  <GameSetup
    v-else-if="state === 'setup'"
    v-model:foyer="foyer"
    :foyer-code="foyerCode"
    :friends="friends"
    @invite="inviteFriend"
    @start="startGame"
  />

  <section v-else>
    <h2>Game started</h2>
  </section>
</template>
