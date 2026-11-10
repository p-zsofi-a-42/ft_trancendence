<script setup lang="ts">
// @ts-ignore -- Zod is installed in web-dev
import * as z from "zod";
import type { FormSubmitEvent, AuthFormField } from "@nuxt/ui";

const toast = useToast();

const fields: AuthFormField[] = [
  {
    name: "email",
    type: "email",
    label: "Email",
    placeholder: "Enter your email",
    required: true,
  },
  {
    name: "password",
    type: "password",
    label: "Password",
    placeholder: "Enter your password",
    required: true,
  },
  {
    name: "remember",
    label: "Remember me",
    type: "checkbox",
  },
];

const providers = [
  {
    icon: "i-simple-icons-42",
    onClick: () => {
      toast.add({ title: "42", description: "Login with 42" });
    },
  },
  {
    icon: "i-simple-icons-github",
    onClick: () => {
      toast.add({ title: "GitHub", description: "Login with GitHub" });
    },
  },
];

const schema = z.object({
  email: z.email("Invalid email"),
  password: z
    .string("Password is required")
    .min(8, "Must be at least 8 characters"),
});

type Schema = z.output<typeof schema>;

const loading = ref(false);

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  loading.value = true;

  try {
    await $fetch("/api/auth/login", {
      method: "POST",
      body: payload.data, // Contains email and password
    });

    await useUserSession().fetch();
    await navigateTo("/profile");
  } catch (err) {
    const message =
      (err as { data?: { message?: string } }).data?.message ?? "Login failed";

    toast.add({ title: "Login failed", description: message });
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
        title="Login"
        icon="i-lucide-user"
        @submit="onSubmit"
        :ui="{
          leadingIcon: 'text-white',
        }"
      >
        <template #description>
          <p>Enter your credentials to access your account.</p>
          <p>
            Don't have an account?
            <ULink to="/register" class="text-primary">Sign Up</ULink>
          </p>
        </template>
      </UAuthForm>
    </UPageCard>
  </div>
</template>
<!-- Inputs with v-model hold the email and password in refs. ref is auto-imported-->
<!-- Submit handler, sends values to server with $fetch. The @submit.prevent stops browser from reloading the page. -->
<!-- Loading and error state, button is disabled when loading and error message is shown if login fails -->
<!-- redirect with navigateTo after successful login -->
