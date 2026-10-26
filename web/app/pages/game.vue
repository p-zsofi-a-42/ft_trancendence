<script setup lang="ts">
  type State = 'foyer' | 'setup' | 'game'
  type Friend = {
    id: number
    name: string
    status: 'online' | 'offline'
    invited: boolean
    joined: boolean
  }

  const state = ref<State>('foyer')
  const foyer = ref({
    name: '',
    companyCount: 3
  })

  const friends = ref<Friend[]>([
    { id: 1, name: 'Alex', status: 'online', invited: false, joined: false},
    { id: 2, name: 'Sam', status: 'offline', invited: false, joined: false},
  ])

  function createFoyer(details: { name: string; companyCount: number }) {
    foyer.value = details
    state.value = 'setup'
  }

  function inviteFriend(friendId: number) {
    friends.value = friends.value.map(friend =>
      friend.id === friendId ? { ...friend, invited: true } : friend
    )
  }

  function startGame() {
    state.value = 'game'
  }
</script>

<template>
  <FoyerSetup
    v-if="state === 'foyer'"
    @create="createFoyer"
  />

  <GameSetup
    v-else-if="state === 'setup'"
    :foyer="foyer"
    :friends="friends"
    @invite="inviteFriend"
    @start="startGame"
  />

  <section v-else>
    <h2>Game started</h2>
  </section>
</template>
