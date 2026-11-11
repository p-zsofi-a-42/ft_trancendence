// Starts 2FA setup for the logged-in user. Returns the secret/QR data for the FE.
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  return callUserService('/internal/totp/setup', { userId: Number(user.id) })
})