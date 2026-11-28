// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  modules: [
    '@nuxt/ui',
    'nuxt-auth-utils', // adds authentication utilities for Nuxt
    '@nuxt/fonts',
  ],
  devtools: { enabled: true },
  nitro: { 
    experimental: { websocket: true } },
  runtimeConfig: {
    // Server-only; overridden by NUXT_USER_SERVICE_URL and NUXT_TOKEN_SECRET.
    userServiceUrl: '',
    gameServiceUrl: '',
    tokenSecret: '',
    redisUrl: '',
    oauthGithubClientId: '',
    oauthGithubClientSecret: '',
    oauthTokenKey: '',
    oauthRedirectUri: '',
  },
  vite: {
    server: {
      // Bind-mounted source (e.g. over NFS, or in some Docker setups) doesn't
      // emit inotify events, so fall back to polling for HMR to work.
      watch: { usePolling: true },
    },
  },
  css: ['~/assets/css/main.css'],
  icon: {
    customCollections: [{
      prefix: 'myOwn',
      dir: './app/assets/icons'
    }]
  },
  fonts: {
    families: [
      { name: 'DM Sans', provider: 'google' },
      { name: 'DM Mono', provider: 'google' },
      { name: 'Lilita One', provider: 'google' },
      { name: 'Palanquin Dark', provider: 'google' },
      { name: 'Parisienne', provider: 'google' }, /*TESTING purposes*/ 
    ],
  },
})