<script setup lang="ts">
  type State = 'setup' | 'view' | 'game'
  type Friend = {
    id: number
    name: string
    status: 'online' | 'offline'
    invited: boolean
    joined: boolean
  }

  const state = ref<State>('setup')
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
    state.value = 'view'
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
    v-if="state === 'setup'"
    @create="createFoyer"
  />

  <FoyerView
    v-else-if="state === 'view'"
    :foyer="foyer"
    :friends="friends"
    @invite="inviteFriend"
    @start="startGame"
  />

  <section v-else>
    <h2>Game started</h2>
  </section>
</template>
