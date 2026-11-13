<script setup lang="ts">
import type { DropdownMenuItem, NavigationMenuItem } from "@nuxt/ui";

const { loggedIn, user } = useUserSession();

const navItems: NavigationMenuItem[] = [
  { label: "Home", to: "/" },
  { label: "Play", to: "/foyer" },
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

const loggedInItems: DropdownMenuItem[] = [
  {
    label: "Profile",
    to: "/profile",
  },
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
];

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
</script>

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
        <UDropdownMenu :items="loggedIn ? loggedInItems : loggedOutItems">
          <UTooltip text="Profile">
            <UButton
              class="w-fit"
              color="neutral"
              variant="foyer"
              block
              trailing-icon="i-lucide-chevron-down"
              aria-label="Profile"
            >
              <CustomUser :user="user" size="xl" />
            </UButton>
          </UTooltip>
        </UDropdownMenu>
      </template>
    </UHeader>

    <UMain
      :ui="{
        base: 'bg-neutral-100 text-primary-950 flex-1 grid place-items-center',
      }"
    >
      <slot />
    </UMain>

    <UFooter
      :ui="{
        root: 'bg-primary-950 text-neutral-100',
      }"
    />
  </div>
</template>
