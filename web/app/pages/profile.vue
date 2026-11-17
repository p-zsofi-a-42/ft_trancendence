<template>
  <div v-if="user">
    <UCard
      :ui="{
        root: 'text-white',
      }"
    >
      <template #header>
        <CustomUser :user="user" size="3xl" />
      </template>
      <p><strong>ID:</strong> {{ user.id }}</p>
      <p><strong>Name:</strong> {{ user.name }}</p>
      <p><strong>Email:</strong> {{ user.email }}</p>
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
    </UCard>
</div>
<!-- TEMP: for manual testing of the 2FA wizard, pending a dedicated settings page -->
<TwoFactAuth />
</template>

<script setup lang="ts">
// Fetch the current user's profile information and handle authentication redirect if not logged in
const { data: user, error } = await useFetch("/api/auth/profile");
if (error.value) {
  await navigateTo("/login");
}

// Linked providers
const PROVIDERS = [
  { name: "github", label: "GitHub", icon: "i-simple-icons-github" },
  { name: "42", label: "42", icon: "i-simple-icons-42" },
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
