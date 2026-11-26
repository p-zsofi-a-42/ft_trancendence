// Protects invalid routes by checking if user is logged in before accessing a page
export default defineNuxtRouteMiddleware(() => {
  const { loggedIn } = useUserSession()

  if (!loggedIn.value) {
    return navigateTo("/login")
  }
})