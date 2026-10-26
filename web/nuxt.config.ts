// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  modules: ['@nuxt/ui', 'nuxt-auth-utils'], // adds authentication utilities for Nuxt
  devtools: { enabled: true },
  runtimeConfig: {
    // Server-only; overridden by NUXT_USER_SERVICE_URL and NUXT_TOKEN_SECRET.
    userServiceUrl: '',
    tokenSecret: '',
  },
  vite: {
    server: {
      // Bind-mounted source (e.g. over NFS, or in some Docker setups) doesn't
      // emit inotify events, so fall back to polling for HMR to work.
      watch: { usePolling: true },
    },
  },
	css: ['~/assets/css/main.css'],
})

