<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";

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

async function join(event: FormSubmitEvent<string>) {}
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
      <UButton color="primary" class="text-white" size="xl" type="button">
        Create
      </UButton>
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
    <UForm @submit="join">
      <UButton type="submit">Join</UButton>
    </UForm>
  </UCard>
</template>
