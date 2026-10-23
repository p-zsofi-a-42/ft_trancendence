<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const open = ref(true)
const settingsOpen = ref(false)

const items: NavigationMenuItem[] = [
    { name: 'Home', icon:'i-lucide-house', to: '/' },
    { name: 'Game', icon:'i-lucide-gamepad', to: '/game' },
    { name: 'Players', icon:'i-lucide-users', to: '/users' },
]

useHead({
  title: "The Beer Game",
})
</script>

<style src="~/assets/css/main.css"></style>

<template>
  <div class="app-shell">
    <header>
      <NuxtLink to="/" class="logo">The Beer Game</NuxtLink>
  
      <nav class="topnav" aria-label="Main navigation">
        <NuxtLink to="/">Home</NuxtLink>
        <NuxtLink to="/game">Game</NuxtLink>
        <NuxtLink to="/users">Players</NuxtLink>
      </nav>
  
      <div class="header-actions">
        <UButton 
          to="/profile" 
          icon="i-lucide-user"
          color="neutral"
          variant="solid"
          aria-label="Settings"
        />
        <UButton
          class="button"
          icon="i-lucide-settings"
          color="neutral"
          aria-label="Settings"
          @click="settingsOpen = true"
        />

        <UModal v-model:open="settingsOpen" title="Settings">
          <template #body>
            <Settings />
          </template>
        </UModal>
      </div>
    </header>

    <main>
      <slot />
    </main>
  </div>
</template>