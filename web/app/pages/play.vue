<template>
  <UCard
    title="Play The Game"
    :ui="{
      title: 'text-2xl',
      body: 'text-center justify-center items-center mx-auto w-full',
    }"
  >
    <UForm @click="create">
      <UButton size="xl" type="button"> Create </UButton>
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
    <UForm :state="codeState" @submit="join">
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
          <UButton size="xl" type="submit"> Join </UButton>
        </template>
      </FormFieldString>
    </UForm>
  </UCard>
</template>

<script setup lang="ts">
import type { FormError, FormSubmitEvent } from "@nuxt/ui";
import type { Game } from "#imports";
import { error } from "#build/ui";

definePageMeta({ middleware: "auth" });

const toast = useToast();

async function create() {
  /* create a new foyer session (game session)
   */
  try {
    const game = await $fetch("/api/foyer/create", {
      method: "POST",
      body: {
        nPlayers: 3,
        nRounds: 12,
        seedCapital: 100000,
        minutesPerRound: 1,
      },
    });
    const code = game.idCode;
    console.log("Game code:", code);

    await $fetch(`/api/company/create`, {
      method: "POST",
      body: {
        name: "",
        gameCode: code,
      },
    });

    toast.add({
      title: "Success",
      description: "The Foyer has been created.",
      color: "success",
    });

    // NAVIGATE TO GAME PAGE
    navigateTo(`/foyer/${code}`);
  } catch (error) {
    if (error instanceof Error) console.log(`error: ${error.message}`);
    else console.log("Unknown error:", error);

    toast.add({
      title: "Failure",
      description: "Failed to create a new Foyer.",
      color: "error",
    });
  }
}

const codeState = reactive({ code: "" });

async function join(event: FormSubmitEvent<string>) {
  await $fetch(`/api/company/create`, {
    method: "POST",
    body: {
      name: "",
      gameCode: event.data.code,
    },
  });

  toast.add({
    title: "Success",
    description: "The Foyer has been created.",
    color: "success",
  });

  // NAVIGATE TO GAME PAGE
  await navigateTo(`/foyer/${event.data.code}`);
}
</script>
