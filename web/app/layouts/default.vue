<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const navItems: NavigationMenuItem[] = [
	{ label: 'Home', to: '/' },
	{ label: 'Game', to: '/game' },
	{ label: 'Social', to: '/users' },
]

useHead({
	title: "The Beer Game",
})
</script>

<style src="~/assets/css/main.css"></style>

<template>
  <div class="app-shell">
    <UHeader
			to="/"
			:toggle="false"
			:ui="{
				left: 'flex items-center gap-2'
			}">
			<template #left>
				<div class="flex flex-wrap items-center gap-2">
					<NuxtLink to="/" class="mr-4 text-lg font-[750]">
						The Beer Game
					</NuxtLink>

					<UNavigationMenu
						:items="navItems"
						orientation="horizontal"
						variant="link"
						:ui="{
							link: 'px-1 py-1 hover:font-bold'
						}"
					/>
				</div>
			</template>

			<template #right>
				<UTooltip text="Profile">
					<UButton
						icon="i-lucide-user"
						size="md"
						color="neutral"
						variant="ghost"
						to="/Profile" 
						aria-label="Profile"
					/>
				</UTooltip>
				<UTooltip text="Settings">
					<UButton
						icon="i-lucide-settings"
						size="md"
						color="neutral"
						variant="ghost"
						to="" 
						aria-label="Settings" 
					/>
				</UTooltip>
			</template>
		</UHeader>

		<UMain :ui="{
			base: 'bg-neutral-100 text-primary-950 flex-1 grid place-items-center'
		}"
		>
			<slot />
		</UMain>

		<UFooter
			:ui="{
				root: 'bg-primary-950 text-neutral-100',
			}"
		/>
  </div>
</template>