// Forwards login to the user service. Only this route creates the full Nuxt session;
// if 2FA is required, it stashes a pending-auth marker instead (never logs the user in yet).
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { user, totpRequired } = await callUserService<{
    message: string
    user: { id: string; name: string; email: string }
    totpRequired: boolean
  }>('/internal/login', { body })

  if (totpRequired) {
    // `secure` is server-only (nuxt-auth-utils encrypts it, never sends it to the browser).
    // No top-level `user` is set, so requireUserSession/loggedIn still treats 
    // this as unauthenticated.
    await setUserSession(event, { secure: { pendingTotpUserId: user.id } })
    return { message: 'TOTP verification required', totpRequired: true }
  }

  await setUserSession(event, { user })
  return { message: 'Login successful', user }
})