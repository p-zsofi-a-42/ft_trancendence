<script setup lang="ts">
import type { Form, FormError, FormSubmitEvent } from "@nuxt/ui";
import { capitalize } from "vue";

const toast = useToast();

async function create() {
  /* create a new foyer session (game session)
   */
  const codeResponse = await $fetch("/api/game", { method: "POST" });
  const code = codeResponse.code;
  console.log("Game code:", code);

  toast.add({
    title: "Success",
    description: "The Foyer has been created.",
    color: "success",
  });

  // NAVIGATE TO GAME PAGE
  await navigateTo(`/foyer/${code}`);
}

const codeState = reactive({ code: "" });

function validateCode(values: Partial<typeof codeState>): FormError[] {
  return values.code?.length === 6
    ? []
    : [{ name: "code", message: "Code must be exactly 6 characters" }];
}

function validate(state: Partial<Foyer>): FormError[] {
  const errors: FormError[] = [];

  if (!state.name?.trim()) errors.push({ name: "name", message: "Required" });
  if (!state.companyCount)
    errors.push({ name: "companyCount", message: "Required" });

  return errors;
}

async function join(event: FormSubmitEvent<typeof codeState>) {
  const code = event.data.code;
  await navigateTo(`/foyer/${code}`);
}
</script>

<template>
  <UCard
    title="Play The Game"
    :ui="{
      title: 'text-2xl',
      body: 'text-center justify-center items-center mx-auto w-full',
    }"
  >
    <UForm @click="create">
      <UButton class="text-white" size="xl" type="button"> Create </UButton>
    </UForm>
    <USeparator
      color="primary"
      label="or"
      type="solid"
      :ui="{
        root: 'w-full my-2',
        label: 'text-lg',
      }"
    />
    <UForm :state="codeState" :validate="validateCode" @submit="join">
      <FormFieldString
        name="code"
        v-model="codeState.code"
        placeholder="ABC123"
        :input-ui="{ trailing: 'pe-0' }"
        size="xl"
        error-side="bottom"
        required
      >
        <template #input-trailing>
          <UButton class="text-white" size="xl" type="submit"> Join </UButton>
        </template>
      </FormFieldString>
    </UForm>
  </UCard>
</template>
