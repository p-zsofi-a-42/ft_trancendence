<template>
  <div>
    <h1>Create a new game</h1>
		<p><strong>some information from the service:</strong> {{ info }}</p>
  </div>
</template>

<script setup lang="ts">
	const { data: info } = await useFetch('/api/game/create')
</script>
