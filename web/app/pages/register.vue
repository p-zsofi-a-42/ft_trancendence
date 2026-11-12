<script setup lang="ts">
// @ts-ignore -- Zod is installed in web-dev
import * as z from "zod";
import type { FormSubmitEvent, AuthFormField } from "@nuxt/ui";

const toast = useToast();

const fields: AuthFormField[] = [
  {
    name: "name",
    type: "text",
    label: "Username",
    placeholder: "Enter your username",
    required: true,
  },
  {
    name: "email",
    type: "email",
    label: "Email",
    placeholder: "Enter your email",
    required: false,
  },
  {
    name: "password",
    type: "password",
    label: "Password",
    placeholder: "Enter your password",
    required: true,
  },
];

// OAuth providers for social login (e.g., 42, GitHub)
const providers = [
  {
    icon: "i-simple-icons-42",
    onClick: () => {
      window.location.href = "/api/auth/oauth/login?provider=42";
    },
  },
  {
    icon: "i-simple-icons-github",
    onClick: () => {
      window.location.href = "/api/auth/oauth/login?provider=github";
    },
  },
];

const schema = z.object({
  name: z.string().trim().min(4, "Name is required"),
  email: z.string().email("Invalid email").optional(),
  password: z
    .string("Password is required")
    .min(8, "Must be at least 8 characters"),
});

type Schema = z.output<typeof schema>;

const loading = ref(false);

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  loading.value = true;

  try {
    await $fetch("/api/auth/register", {
      method: "POST",
      body: payload.data, // Contains email and password
    });
    await navigateTo("/login");
  } catch (err) {
    const message =
      (err as { data?: { message?: string } }).data?.message ??
      "Register failed";

    toast.add({ title: "Register failed", description: message });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4">
    <UPageCard>
      <UAuthForm
        :schema="schema"
        :fields="fields"
        :providers="providers"
        :loading="loading"
        title="Sign Up"
        icon="i-lucide-user"
        @submit="onSubmit"
        :ui="{
          leadingIcon: 'text-white',
        }"
      >
        <template #description>
          <p>Enter your credentials to create your account.</p>
        </template>
      </UAuthForm>
    </UPageCard>
  </div>
</template>
