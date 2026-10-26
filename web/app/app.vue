<script setup lang="ts">
useHead({
	title: "The Beer Game",
})
</script>

<template>
	<UApp>
		<UHeader to="/" :toggle="false" :ui="{ left: 'site-header-left', right: 'site-header-right' }">
			<template #left>
				<div class="brand-and-nav">
					<NuxtLink to="/" class="site-title">The Beer Game</NuxtLink>

					<nav class="topnav" aria-label="Main navigation">
						<NuxtLink to="/">Home</NuxtLink>
						<NuxtLink to="/game">Game</NuxtLink>
						<NuxtLink to="/users">Players</NuxtLink>
					</nav>
				</div>
			</template>


			<template #right>
				<UTooltip text="Profile">
					<UButton color="neutral" variant="ghost" to="/Profile" icon="i-lucide-user" aria-label="Profile" />
				</UTooltip>
			</template>
		</UHeader>

		<UMain>
			<NuxtPage />
		</UMain>

		<UFooter />
	</UApp>
</template>
