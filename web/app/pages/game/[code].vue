<!-- SETUP AND GAME PAGE -->

<!-- LOGIC -->
<script setup lang="ts">
	const code  = useRoute().params.code as string
</script>

<!-- HTML CONTENT -->
<template>
  <div>
    <h1>Game Page</h1>
    <p>Game code: {{ code }}</p>
  </div>
  <Game :foyer-code="code" />
</template>