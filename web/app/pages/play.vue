<script setup lang="ts">
import type { FormError, FormSubmitEvent } from "@nuxt/ui";
import type { GameSettings } from "#imports";
import { error } from "#build/ui";

const toast = useToast();

async function create() {
  /* create a new foyer session (game session)
   */
  try {
    const response = await $fetch("/api/foyer/create", {
      method: "POST",
      body: { nPlayers: 3, nRounds: 12, seedCapital: 100000 },
    });
    console.log(`response: ${JSON.stringify(response)}`);
    const game = response.game;
    const code = game.idCode;
    console.log("Game code:", code);

    toast.add({
      title: "Success",
      description: "The Foyer has been created.",
      color: "success",
    });

    // NAVIGATE TO GAME PAGE
    navigateTo(`/foyer/${code}`);
  } catch (error) {
    console.log(`error: ${error.message}`);
    toast.add({
      title: "Failure",
      description: "Failed to create a new Foyer.",
      color: "error",
    });
  }
}

async function join(event: FormSubmitEvent<string>) {
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

function validateJoin(values: Partial<typeof codeState>): FormError[] {
  return values.code?.length === 6
    ? []
    : [{ name: "code", message: "Code must be exactly 6 characters" }];
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
    <UForm :state="codeState" :validate="validateJoin" @submit="join">
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
