<script setup lang="ts">
const tab_items = [
	{
		label: 'Foyer',
		slot: 'foyer-view'
	},
	{
		label: 'Business Setup',
		slot: 'business-setup-view'
	},
	{
		Label: 'Game Start',
		slot: 'game-start'
	}
]

const foyer_view_items = [
	{
		slot: 'config',
		minSize: 20,
		defaultSize: 50,
		id: 'foyer-view-config',
	},
	{
		slot: 'invite',
		minSize: 20,
		defaultSize: 50,
		id: 'foyer-view-invite'
	}
]

defineProps<{
	foyer: {
		name: string
		companyCount: number
	}
}>()
</script>


<template>
	<UTabs :items="tab_items" id="game-setup" class="window" :ui="{
		list: 'game-tabs-list',
		trigger: 'game-tab',
		content: 'game-tab-panel'
	}">	
		<template #foyer-view>
			<USplitter :items="foyer_view_items">
				<template #config>
					Foyer: {{ foyer.name }}
					Companies: {{ foyer.companyCount }}
				</template>
				<template #invite>
					Invite
				</template>
			</USplitter>
		</template>
		<template #business-config>

		</template>
		<template #game-start>

		</template>
	</UTabs>
</template>

<style lang="css">
@import url("~/assets/css/main.css");

#game-setup {
	width: 60%;
	max-height: 60rem;
	min-height: 60vh;
	align-items: start;
	justify-content: start;
}

#foyer-view-config {
	background-color: var(--color5);

}
</style>