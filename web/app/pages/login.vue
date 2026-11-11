<script setup lang="ts">
// @ts-ignore -- Zod is installed in web-dev
import * as z from "zod";
import type { FormSubmitEvent, AuthFormField } from "@nuxt/ui";

const toast = useToast();

const fields: AuthFormField[] = [
  { name: "email", type: "email", label: "Email", placeholder: "Enter your email", required: true },
  { name: "password", type: "password", label: "Password", placeholder: "Enter your password", required: true },
  { name: "remember", label: "Remember me", type: "checkbox" },
];

const providers = [
  { icon: "i-simple-icons-42", onClick: () => toast.add({ title: "42", description: "Login with 42" }) },
  { icon: "i-simple-icons-github", onClick: () => toast.add({ title: "GitHub", description: "Login with GitHub" }) },
];

const schema = z.object({
  email: z.email("Invalid email"),
  password: z.string("Password is required").min(8, "Must be at least 8 characters"),
});
type Schema = z.output<typeof schema>;

// 2FA code / recovery-code fields
const totpFields: AuthFormField[] = [
  { name: "code", type: "text", label: "Code", placeholder: "123456", required: true },
];
const totpSchema = z.object({ code: z.string().min(6, "Enter the code") });
type TotpSchema = z.output<typeof totpSchema>;

const loading = ref(false);
const totpPending = ref(false);
const useRecovery = ref(false);

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  loading.value = true;
  try {
    const result = await $fetch("/api/auth/login", {
      method: "POST",
      body: payload.data,
    });
    if ("totpRequired" in result && result.totpRequired) {
      totpPending.value = true;
      return;
    }
    await useUserSession().fetch();
    await navigateTo("/profile");
  } catch (err) {
    const message = (err as { data?: { message?: string } }).data?.message ?? "Login failed";
    toast.add({ title: "Login failed", description: message });
  } finally {
    loading.value = false;
  }
}

async function onSubmitTotp(payload: FormSubmitEvent<TotpSchema>) {
  loading.value = true;
  try {
    const endpoint = useRecovery.value ? "/api/auth/totp/recovery" : "/api/auth/totp/verify";
    await $fetch(endpoint, { method: "POST", body: { code: payload.data.code } });
    await useUserSession().fetch();
    await navigateTo("/profile");
  } catch (err) {
    const message = (err as { data?: { message?: string } }).data?.message ?? "Invalid code";
    toast.add({ title: "Verification failed", description: message });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4">
    <UPageCard v-if="!totpPending">
      <UAuthForm
        :schema="schema"
        :fields="fields"
        :providers="providers"
        :loading="loading"
        title="Login"
        icon="i-lucide-user"
        @submit="onSubmit"
        :ui="{ leadingIcon: 'text-white' }"
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

    <UPageCard v-else>
      <UAuthForm
        :schema="totpSchema"
        :fields="totpFields"
        :loading="loading"
        title="Two-factor authentication"
        icon="i-lucide-shield-check"
        @submit="onSubmitTotp"
      >
        <template #description>
          <p>{{ useRecovery ? 'Enter one of your recovery codes.' : 'Enter the 6-digit code from your authenticator app.' }}</p>
          <p>
            <ULink as="button" class="text-primary" @click="useRecovery = !useRecovery">
              {{ useRecovery ? 'Use authenticator code instead' : 'Use a recovery code instead' }}
            </ULink>
          </p>
        </template>
      </UAuthForm>
    </UPageCard>
  </div>
</template>