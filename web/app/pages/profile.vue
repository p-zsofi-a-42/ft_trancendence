<template>
  <div v-if="user">
    <UCard
      :ui="{
        root: 'text-text',
      }"
    >
      <template #header>
        <CustomUser :user="user" size="3xl" />
      </template>
      <UForm v-if="editing" :schema="schema" :state="form" class="pt-2" @submit="saveProfile">
        <div class="pb-2">
          <UButton
            label="Change profile picture"
            icon="i-myOwn-upload"
            :loading="uploadingAvatar"
            @click="avatarInput?.click()"
          />
          <input
            ref="avatarInput"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            class="hidden"
            @change="uploadAvatar"
          />
        </div>
        <p><strong>ID:</strong> {{ user.id }}</p>
        <FormFieldString name="name" label="Username" v-model="form.name" required />
        <FormFieldString name="email" label="Email" v-model="form.email" />
        <div class="flex gap-2 pt-2">
          <UButton type="submit" label="Save" :loading="saving" />
          <UButton label="Cancel" color="neutral" variant="ghost" :disabled="saving" @click="editing = false" />
        </div>
      </UForm>
      <template v-else>
        <p><strong>Name:</strong> {{ user.name }}</p>
        <p><strong>Email:</strong> {{ user.email }}</p>
        <UButton label="Edit profile" class="mt-2" @click="startEdit" />
      </template>
      <div v-if="Array.isArray(linkedProviders)" class="pt-4 space-y-3">
        <h3 class="font-semibold">Login providers</h3>
        <div v-for="p in PROVIDERS" :key="p.name" class="flex items-center justify-between">
          <span class="flex items-center gap-2"><UIcon :name="p.icon" /> {{ p.label }}</span>
          <UButton
            v-if="!isLinked(p.name)"
            :label="`Link ${p.label}`"
            :href="`/api/auth/oauth/login?provider=${p.name}&intent=link`"
            external
          />
          <UButton
            v-else
            label="Unlink"
            color="error"
            :loading="busy === p.name"
            @click="unlink(p)"
          />
        </div>
      </div>
      <div class="pt-4 space-y-3">
        <h3 class="font-semibold">Password</h3>
        <UButton
          v-if="!changingPassword"
          :label="user.hasPassword ? 'Change password' : 'Set password'"
          @click="startPasswordChange"
        />
        <UForm v-else :schema="passwordSchema" :state="passwordForm" class="space-y-3" @submit="savePassword">
          <FormFieldString
            v-if="user.hasPassword"
            name="currentPassword"
            label="Current password"
            type="password"
            v-model="passwordForm.currentPassword"
            required
          />
          <FormFieldString name="newPassword" label="New password" type="password" v-model="passwordForm.newPassword" required />
          <FormFieldString
            name="confirmPassword"
            label="Confirm new password"
            type="password"
            v-model="passwordForm.confirmPassword"
            required
          />
          <FormFieldString v-if="!user.email" name="email" label="Email" v-model="passwordForm.email" required />
          <FormFieldString
            v-if="user.totpEnabled"
            name="totpCode"
            label="Authenticator code"
            v-model="passwordForm.totpCode"
            required
          />
          <div class="flex gap-2 pt-2">
            <UButton type="submit" label="Save password" :loading="savingPassword" />
            <UButton
              label="Cancel"
              color="neutral"
              variant="ghost"
              :disabled="savingPassword"
              @click="cancelPasswordChange"
            />
          </div>
        </UForm>
      </div>
    </UCard>
</div>
<!-- TEMP: for manual testing of the 2FA wizard, pending a dedicated settings page -->
<TwoFactAuth />
</template>

<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";

// Fetch the current user's profile information and handle authentication redirect if not logged in
const { data: user, error, refresh: refreshProfile } = await useFetch("/api/auth/profile");
if (error.value) {
  await navigateTo("/login");
}

// Profile editing; the rules match the register form
const editing = ref(false);
const saving = ref(false);
const form = reactive({ name: "", email: "" });
const schema = z.object({
  name: z.string().trim().min(4, "Name must be at least 4 characters"),
  email: z.string().trim().email("Invalid email").or(z.literal("")),
});

function startEdit() {
  form.name = user.value?.name ?? "";
  form.email = user.value?.email ?? "";
  editing.value = true;
}

async function saveProfile(event: FormSubmitEvent<z.output<typeof schema>>) {
  saving.value = true;
  try {
    await $fetch("/api/auth/profile", {
      method: "PATCH",
      body: { name: event.data.name, email: event.data.email === "" ? null : event.data.email },
    });
    await Promise.all([refreshProfile(), useUserSession().fetch()]);
    editing.value = false;
    toast.add({ title: "Profile updated" });
  } catch (err) {
    const message = (err as { data?: { message?: string } }).data?.message ?? "Please try again";
    toast.add({ title: "Update failed", description: message });
  } finally {
    saving.value = false;
  }
}

// Password: set one (OAuth-only accounts) or change it. Requirements depend on the account state.
const passwordSchema = z
  .object({
    currentPassword: z.string(),
    newPassword: z.string().min(8, "Must be at least 8 characters"),
    confirmPassword: z.string(),
    email: z.string().trim().email("Invalid email").or(z.literal("")),
    totpCode: z.string(),
  })
  .superRefine((data, ctx) => {
    if (user.value?.hasPassword && !data.currentPassword) {
      ctx.addIssue({ code: "custom", path: ["currentPassword"], message: "Current password is required" });
    }
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({ code: "custom", path: ["confirmPassword"], message: "Passwords do not match" });
    }
    if (!user.value?.email && !data.email) {
      ctx.addIssue({ code: "custom", path: ["email"], message: "Email is required to set a password" });
    }
    if (user.value?.totpEnabled && !data.totpCode) {
      ctx.addIssue({ code: "custom", path: ["totpCode"], message: "Authenticator code is required" });
    }
  });

const changingPassword = ref(false);
const savingPassword = ref(false);
const passwordForm = reactive({ currentPassword: "", newPassword: "", confirmPassword: "", email: "", totpCode: "" });

function resetPasswordForm() {
  Object.assign(passwordForm, { currentPassword: "", newPassword: "", confirmPassword: "", email: "", totpCode: "" });
}

function startPasswordChange() {
  resetPasswordForm();
  changingPassword.value = true;
}

function cancelPasswordChange() {
  resetPasswordForm();
  changingPassword.value = false;
}

async function savePassword(event: FormSubmitEvent<z.output<typeof passwordSchema>>) {
  savingPassword.value = true;
  try {
    await $fetch("/api/auth/password", {
      method: "PATCH",
      body: {
        currentPassword: event.data.currentPassword,
        newPassword: event.data.newPassword,
        email: event.data.email,
        totpCode: event.data.totpCode,
      },
    });
    await Promise.all([refreshProfile(), useUserSession().fetch()]);
    cancelPasswordChange();
    toast.add({ title: "Password saved" });
  } catch (err) {
    const message = (err as { data?: { message?: string } }).data?.message ?? "Please try again";
    toast.add({ title: "Password update failed", description: message });
  } finally {
    savingPassword.value = false;
  }
}

// Profile picture upload
const avatarInput = ref<HTMLInputElement | null>(null);
const uploadingAvatar = ref(false);
const avatarVersion = useAvatarVersion();

async function uploadAvatar(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) {
    return;
  }

  const body = new FormData();
  body.append("avatar", file);
  uploadingAvatar.value = true;
  try {
    await $fetch("/api/auth/avatar", { method: "POST", body });
    avatarVersion.value++;
    toast.add({ title: "Profile picture updated" });
  } catch (err) {
    const message = (err as { data?: { message?: string } }).data?.message ?? "Please try again";
    toast.add({ title: "Upload failed", description: message });
  } finally {
    uploadingAvatar.value = false;
    input.value = "";
    
  }
}

// Linked providers
const PROVIDERS = [
  { name: "github", label: "GitHub", icon: "i-myOwn-github" },
];

// Fetch the list of linked OAuth providers for the current user
const { data: linkedProviders, refresh: refreshAccounts } = await useFetch<string[]>("/api/auth/oauth/accounts");
// Helper function to check if a provider is linked
const isLinked = (name: string) => Array.isArray(linkedProviders.value) && linkedProviders.value.includes(name);

const busy = ref<string | null>(null);
async function unlink(p: { name: string; label: string }) {
  busy.value = p.name;
  try {
    await $fetch("/api/auth/oauth/unlink", { method: "POST", body: { provider: p.name } });
    await refreshAccounts();
    toast.add({ title: `${p.label} unlinked` });
  } catch (err) {
    const message = (err as { data?: { message?: string } }).data?.message ?? "Please try again";
    toast.add({ title: "Unlink failed", description: message });
  } finally {
    busy.value = null;
  }
}
// Result of the link redirect from the OAuth callback (?oauth=linked or ?oauth=link_conflict)
const route = useRoute();
const router = useRouter();
const toast = useToast();
onMounted(() => {
  const status = route.query.oauth;
  const label = PROVIDERS.find(p => p.name === route.query.provider)?.label ?? "Provider";
  if (status === "linked") {
    toast.add({ title: `${label} linked`, description: `Your ${label} account is now linked.` });
  } else if (status === "link_conflict") {
    toast.add({ title: `${label} not linked`, description: `This ${label} account is already linked to a user.` });
  }
  if (status) {
    router.replace({ query: {} });
  }
});
</script>
