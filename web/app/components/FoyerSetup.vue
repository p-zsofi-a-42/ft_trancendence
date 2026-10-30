<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '@nuxt/ui'

type FormState = {
	name: string
	companyCount: number
}

const state = reactive<FormState>({
	name: '',
	companyCount: 3
})

function validate(state: Partial<FormState>): FormError[] {
	const errors: FormError[] = []

	if (!state.name?.trim()) errors.push({ name: 'name', message: 'Required' })
	if (!state.companyCount) errors.push({ name: 'companyCount', message: 'Required' })

	return errors
}

const toast = useToast()

const emit = defineEmits<{
	create: [foyer: FormState]
}>()

async function submit(event: FormSubmitEvent<FormState>) {
	toast.add({
		title: 'Success',
		description: 'The Foyer has been created.',
		color: 'success'
	})

	emit('create', event.data)
}
</script>

<template>
	<UCard
		:ui="{
			root: 'flex flex-col w-fit rounded-2xl p-1',
			title: 'text-center'
		}"	
	>
		<template #title>
			Foyer Configuration
		</template>

		<UForm
			:state="state"
			:validate="validate"
			@submit="submit"
		>
			<FormFieldTooltip label="Foyer name" name="name" required>
				<UInput
					v-model="state.name"
					name="name"
					type="text"
					class="w-full"
				/>
			</FormFieldTooltip>
			<FormFieldTooltip label="Number of Companies" name="companyCount" required>
				<UInput
					v-model="state.companyCount"
					name="companyCount"
					type="number"
					class="w-full"
				/>
			</FormFieldTooltip>

			<UButton type="submit" class="block mx-auto mt-4">Create</UButton>
		</UForm>
	</UCard>
</template>