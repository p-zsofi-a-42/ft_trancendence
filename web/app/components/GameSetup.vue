<script setup lang="ts">
import type { StepperItem } from '@nuxt/ui'
import type { SplitterItem } from '@nuxt/ui'

const stepper_items = ref<StepperItem[]>([
	{
		title: 'Foyer',
		slot: 'foyer-view'
	},
	{
		title: 'Business Setup',
		slot: 'business-setup-view'
	},
	{
		title: 'Game Start',
		slot: 'game-start'
	}
])

const foyerViewItems: SplitterItem[] = [
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
	<UCard class="w-2/3 h-3/4 items-center bg-neutral-900 ring-neutral-950">
		<UStepper
      :items="stepper_items"
      class="w-full"
      :ui="{
        list: 'w-1/2 mx-auto',
        content: 'w-full mt-4'
      }">
			<template #foyer-view>
				<USplitter :items="foyerViewItems" class="h-96 w-full">
					<template #config>
            <UCard class="h-full min-w-0">
              Foyer: {{ foyer.name }}
						  Companies: {{ foyer.companyCount }}
            </UCard>
					</template>
					<template #players>
						<UCard class="h-full min-w-0">
              Players
            </UCard>
					</template>
					<template #invite>
						<UCard class="h-full min-w-0">
              Friends
            </UCard>
					</template>
				</USplitter>
			</template>
			<template #business-setup-view>
	
			</template>
			<template #game-start>
	
			</template>
		</UStepper>
	</UCard>
</template>