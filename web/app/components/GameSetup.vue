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
		defaultSize: 100 / 3,
	},
	{
		slot: 'players',
		minSize: 20,
		defaultSize: 100 / 3,
	},
	{
		slot: 'invite',
		minSize: 20,
		defaultSize: 100 / 3,
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
	<UCard class="w-2/3 items-center bg-neutral-500">
		<UTabs :items="tab_items" >
			<template #foyer-view>
				<USplitter :items="foyer_view_items">
					<template #config>
						Foyer: {{ foyer.name }}
						Companies: {{ foyer.companyCount }}
					</template>
					<USeparator orientation="vertical" class="h-48" />
					<template #players>
						Players
					</template>
					<USeparator orientation="vertical" class="h-48" />
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
	</UCard>
</template>