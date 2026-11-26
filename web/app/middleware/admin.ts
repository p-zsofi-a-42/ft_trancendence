// Guards admin pages in the browser: anonymous users go to login, non-admins to the home page.
// The server still enforces the same rule on every admin API call.
export default defineNuxtRouteMiddleware(() => {
  const { loggedIn, user } = useUserSession()
  if (!loggedIn.value) {
    return navigateTo('/login')
  }
  if (user.value?.role !== 'admin') {
    return navigateTo('/')
  }
})
