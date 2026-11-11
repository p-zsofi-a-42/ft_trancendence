<script setup lang="ts">
import type { FormError, FormSubmitEvent } from "@nuxt/ui";
import type { Foyer } from "#shared/types/game";

const state = reactive<Foyer>({
  name: "",
  companyCount: 3,
});

function validate(state: Partial<Foyer>): FormError[] {
  const errors: FormError[] = [];

  if (!state.name?.trim()) errors.push({ name: "name", message: "Required" });
  if (!state.companyCount)
    errors.push({ name: "companyCount", message: "Required" });

  return errors;
}

const toast = useToast();

const emit = defineEmits<{
  create: [foyer: Foyer];
}>();

async function submit(event: FormSubmitEvent<Foyer>) {
  /* create a new foyer session (game session)
  */
  const  codeResponse  = await $fetch("/api/game", {
    method: "POST",
    body: event.data,
  });
  const code = codeResponse.code;
  console.log("Game code:", code);
  
  toast.add({
    title: "Success",
    description: "The Foyer has been created.",
    color: "success",
  });

	// const response = await $fetch('/api/game/create', { method: 'POST', body: {name: event.data.name} })
  emit("create", event.data);
  // NAVIGATE TO GAME PAGE
  // navigateTo(`/game/${code}`);
}
</script>

<template>
  <UCard
    :ui="{
      root: 'flex flex-col w-fit rounded-2xl p-1',
      title: 'text-center',
    }"
  >
    <template #title> Foyer Configuration </template>

    <UForm :state="state" :validate="validate" @submit="submit">
      <FormFieldString
        v-model="state.name"
        label="Foyer name"
        name="name"
        required
      />
      <FormFieldNumber
        v-model="state.companyCount"
        label="Number of Companies"
        name="companyCount"
        required
      />
      <UButton
        class="mx-auto text-white"
        size="xl"
        type="submit"
        variant="foyer"
        >Create</UButton
      >
    </UForm>
  </UCard>
</template>
