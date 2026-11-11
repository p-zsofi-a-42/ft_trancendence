// Second step of login when 2FA is enabled: verifies the TOTP code against the
// pending-auth user from login.post.ts, then promotes the session to fully logged in.
export default defineEventHandler(async (event) => {
  const { secure } = await getUserSession(event)
  const pendingUserId = secure?.pendingTotpUserId
  if (!pendingUserId) {
    setResponseStatus(event, 401)
    return { message: 'No pending TOTP verification' }
  }

  const { code } = await readBody(event)
  await callUserService('/internal/totp/verify', {
    body: { code },
    userId: Number(pendingUserId),
  })

  const user = await callUserService<{ id: string; name: string; email: string }>(
    '/users/me',
    { method: 'GET', userId: Number(pendingUserId) },
  )

  // Replaces the whole session (clears secure.pendingTotpUserId), sets the real `user`.
  await replaceUserSession(event, { user })
  return { message: 'Login successful', user }
})