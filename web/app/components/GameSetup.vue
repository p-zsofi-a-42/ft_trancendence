<script setup lang="ts">
const items = [
	{
		label: 'Foyer',
		slot: 'foyer-view'
	},
	{
		label: 'Business Setup',
		slot: 'business-setup-view'
	}
]

defineProps<{
	foyer: {
		name:string
		companyCount: number
	}
}>()
</script>

<template>
	<UTabs :items="items"
		id="game-setup"
		class="window"
		:ui="{
			list: 'game-tabs-list',
			trigger: 'game-tab',
			content: 'game-tab-panel'
		}"
	>
		<template #foyer-view>
			Foyer: {{ foyer.name }}
			Companies: {{ foyer.companyCount }}
		</template>
	</UTabs>
</template>