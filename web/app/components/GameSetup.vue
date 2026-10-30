<script setup lang="ts">
import type { StepperItem } from '@nuxt/ui'
import type { SplitterItem } from '@nuxt/ui'
import type { ListboxItem } from '@nuxt/ui';

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

const foyerInfoItems = computed<ListboxItem[]>(() => [
	{
		label: `Foyer: ${props.foyer.name}`,
		value: 'foyer-name',
		disabled: true
	},
	{
		label: `Companies: ${props.foyer.companyCount}`,
		value: 'company-count',
		disabled: true
	}
])

const props = defineProps<{
	foyer: {
		name: string
		companyCount: number
	}
}>()
</script>


<template>
	<UCard :ui="{
		root: 'w-2/3 h-3/4 flex flex-col',
		body: 'flex flex-1 flex-col min-h-0'
	}">
		<UStepper
      :items="stepper_items"
      :ui="{
				root: 'w-full flex-1 min-h-0',
        content: 'w-full my-4 flex-1 min-h-0'
      }">
			<template #foyer-view>
				<USplitter :items="foyerViewItems" :ui="{
					root: 'w-full h-full min-h-0',
					panel: 'h-full min-h-0 p-0 justify-center'
				}">
					<template #config>
            <UCard title="Foyer" variant="foyer">
							<p v-for="item in foyerInfoItems" :key="item.value">
								{{ item.label }}
							</p>
						</UCard>
					</template>
					<template #players>
						<UListbox :items="[]" class="w-full" />
					</template>
					<template #invite>
						<UListbox :items="[]" class="w-full" />
					</template>
				</USplitter>
			</template>
			<template #business-setup-view>
				Business Setup
			</template>
			<template #game-start>
				Game Start
			</template>
		</UStepper>
	</UCard>
</template>