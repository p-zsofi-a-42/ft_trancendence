<script setup lang="ts">
const name = ref('')
const companyCount = ref(3)

const emit = defineEmits<{
	create: [foyer: { name: string, companyCount: number }]
}>()

function submit() {
	emit('create', {
		name: name.value,
		companyCount: Number(companyCount.value)
	})
}
</script>

<template>
	<UCard class="w-full max-w-md window">
		<template #header>
			<h1>Foyer Configuration</h1>
		</template>

		<form class="foyer-form" @submit.prevent="submit">
			<UFormField label="Foyer Name" name="name" required>
				<UInput id="foyer-name" v-model="name" name="name" type="text" variant="none" class="w-full" />
			</UFormField>

			<UFormField label="Number of Companies" name="companyCount" required>
				<UInput id="company-count" v-model="companyCount" name="companyCount" type="number" variant="none"
					class="w-full" />
			</UFormField>
			<UButton type="submit">Create</UButton>
		</form>
		
	</UCard>
</template>