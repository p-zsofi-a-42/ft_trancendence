<script setup lang="ts">
defineProps<{
	label: string
	name: string
	required?: boolean
}>()
</script>

<template>
	<UFormField
		:label="label"
		:name="name"
		:required="required"
		:ui="{ root: 'pb-3 items-center', error: 'hidden' }"
	>
		<template #default="{ error }">
			<UTooltip
				:text="typeof error === 'string' ? error : 'Required'"
				:open="Boolean(error)"
				:disabled="!error"
				:arrow="true"
				:ui="{ text: 'text-error' }"
				:content="{ side: 'right' }"
			>
				<slot />
			</UTooltip>
		</template>
	</UFormField>
</template>