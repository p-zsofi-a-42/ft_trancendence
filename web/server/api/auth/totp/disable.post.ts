/* 
  * TODO: security downgrade. Should ask for password before disabling 2FA 
*/
// Disables 2FA for the logged-in user.
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  return callUserService('/internal/totp/disable', {
    userId: Number(user.id),
  })
})