// Confirms 2FA setup for the logged-in user with their first TOTP code.
// Returns the one-time recovery codes - the only time they're ever shown in plaintext.
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const { code } = await readBody(event)
  return callUserService('/internal/totp/enable', {
    body: { code },
    userId: Number(user.id),
  })
})