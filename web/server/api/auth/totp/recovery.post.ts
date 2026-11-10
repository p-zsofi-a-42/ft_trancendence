// Fallback second step of login when the user can't produce a TOTP code (lost device).
// Mirrors verify.post.ts, but consumes a one-time recovery code instead.
export default defineEventHandler(async (event) => {
  const { secure } = await getUserSession(event)
  const pendingUserId = secure?.pendingTotpUserId
  if (!pendingUserId) {
    setResponseStatus(event, 401)
    return { message: 'No pending TOTP verification' }
  }

  const { code } = await readBody(event)
  await callUserService('/internal/totp/recovery-code/consume', {
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