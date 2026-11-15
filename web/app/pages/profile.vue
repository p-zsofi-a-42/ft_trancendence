<template>
  <div v-if="user">
    <UCard
      :ui="{
        root: 'text-white',
      }"
    >
      <template #header>
        <UUser
          :name="user.name"
          :avatar="{
            loading: 'lazy',
            icon: 'i-lucide-user',
          }"
          chip
          size="3xl"
        />
      </template>
      <p><strong>ID:</strong> {{ user.id }}</p>
      <p><strong>Name:</strong> {{ user.name }}</p>
      <p><strong>Email:</strong> {{ user.email }}</p>
      <div v-if="showLinkGithub" class="pt-4">
        <UButton
          label="Link GitHub"
          icon="i-simple-icons-github"
          :href="'/api/auth/oauth/login?provider=github&intent=link'"
          external
        />
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

// Linked provider names (e.g. ["github"]). Undefined if the request fails, which hides the link button.
const { data: linkedProviders } = await useFetch<string[]>("/api/auth/oauth/accounts");
const showLinkGithub = computed(
  () => Array.isArray(linkedProviders.value) && !linkedProviders.value.includes("github"),
);

// Result of the link redirect from the OAuth callback (?oauth=linked or ?oauth=link_conflict)
const route = useRoute();
const router = useRouter();
const toast = useToast();
onMounted(() => {
  const status = route.query.oauth;
  if (status === "linked") {
    toast.add({ title: "GitHub linked", description: "Your GitHub account is now linked." });
  } else if (status === "link_conflict") {
    toast.add({ title: "GitHub not linked", description: "This GitHub account is already linked to a user." });
  }
  if (status) {
    router.replace({ query: {} });
  }
});
</script>
