<template>
  <div>
    <h1>Create a new game</h1>
		<p><strong>some information from the service:</strong> {{ response }}</p>
  </div>
</template>

<script setup lang="ts">
	// const { data } = await useFetch('/api/game/create');
	const { response } = await $fetch('/api/game/create', { method: 'POST', body: {creator_id: 123, n_players: 3, n_rounds: 12, seed_capital: 100000} })
</script>
