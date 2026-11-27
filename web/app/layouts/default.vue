<style src="~/assets/css/main.css"></style>

<template>
  <div class="app-shell">
    <UHeader
      to="/"
      :toggle="false"
      :ui="{
        left: 'flex items-center gap-2',
      }"
    >
      <template #left>
        <div class="flex flex-wrap items-center gap-2">
          <NuxtLink to="/" class="mr-4 text-lg font-[750]">
            The Beer Game
          </NuxtLink>

          <UNavigationMenu
            :items="navItems"
            orientation="horizontal"
            variant="link"
            :ui="{
              link: 'px-1 py-1 hover:font-bold',
            }"
          />
        </div>
      </template>

      <template #right>
        <UButton color="neutral" variant="ghost" @click="toggleTheme">
          <UIcon
            :name="colorMode.value === 'dark' ? 'i-myOwn-sun' : 'i-myOwn-moon'"
          />
        </UButton>

        <UDropdownMenu :items="loggedIn ? loggedInItems : loggedOutItems">
          <UTooltip text="Profile">
            <UButton
              class="w-fit"
              color="neutral"
              variant="foyer"
              block
              trailing-icon="i-myOwn-chevron-down"
              aria-label="Profile"
            >
              <CustomUser v-if="loggedIn && user" :user="user" size="xl" />
              <span v-else>Account</span>
            </UButton>
          </UTooltip>
        </UDropdownMenu>
      </template>
    </UHeader>

    <UMain
      :ui="{
        base: 'bg-transparent text-text flex-1 grid place-items-center',
      }"
    >
      <slot />
    </UMain>

    <ChatMessages v-if="loggedIn" />

    <UFooter
      :ui="{
        root: 'bg-transparent text-text',
      }"
    />
  </div>
</template>

<script setup lang="ts">
import type { DropdownMenuItem, NavigationMenuItem } from "@nuxt/ui";

const { loggedIn, user } = useUserSession();
// Initialize presence tracking based on user login state
const presence = usePresence();
watch(
  loggedIn,
  (isLoggedIn) => (isLoggedIn ? presence.start() : presence.stop()),
  { immediate: true },
);

const navItems: NavigationMenuItem[] = [
  { label: "Home", to: "/" },
  { label: "Play", to: "/play" },
  { label: "Social", to: "/social" },
];

const logout = async () => {
  // Send logout request to the server
  try {
    await fetch("/api/auth/logout", { method: "POST" });
    await useUserSession().clear(); // refresh the user session after logout
    await navigateTo("/login");
  } catch (err) {
    console.error("Logout failed", err);
  }
};

const loggedInItems = computed<DropdownMenuItem[]>(() => [
  {
    label: "Profile",
    to: "/profile",
  },
  ...(user.value?.role === "admin"
    ? [{ label: "Admin", to: "/admin/users" }]
    : []),
  {
    label: "Settings",
  },
  {
    label: "Logout",
    color: "error",
    onSelect() {
      logout();
    },
  },
]);

const loggedOutItems: DropdownMenuItem[] = [
  {
    label: "Login",
    to: "/login",
  },
  {
    label: "Register",
    to: "/register",
  },
  {
    label: "Settings",
  },
];

useHead({
  title: "The Beer Game",
});

/* Dark/Light mode*/
const colorMode = useColorMode();
function toggleTheme() {
  colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
}
</script>
