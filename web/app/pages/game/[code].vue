<!-- SETUP AND GAME PAGE -->

<!-- LOGIC -->
<script setup lang="ts">
import type { Game, Company, Round, RoundResult } from "#shared/types/game";

// TODO: check if the game has started and that the user is part of the game
const code = useRoute().params.code as string;
try {
	const { loggedIn, user } = useUserSession();
	console.log("User session:", JSON.stringify(user.value));
	const game = await $fetch<Game>(`/api/game/${code}`, { method: "GET" });
	console.log("Game data:", JSON.stringify(game));
	const companies = await $fetch<Company[]>(`/api/game/${code}/companies`, { method: "GET" });
	if (!companies.some((c) => c.userId == user.value.id) || game.status !== "ongoing" || companies.length === 0)
		navigateTo(`/foyer/${game.idCode}`);
} catch (error) {
	console.error("Error fetching game data:", error);
}

</script>

<!-- HTML CONTENT -->
<template>
	<div>
		<h1>Game Page</h1>
		<p>Game code: {{ code }}</p>
	</div>
</template>
