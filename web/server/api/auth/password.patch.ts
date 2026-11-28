export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const body = (await readBody<{ currentPassword?: unknown; newPassword?: unknown; email?: unknown; totpCode?: unknown }>(event)) ?? {}
  const updated = await callUserService<{ message: string; email: string }>('/users/me/password', {
    method: 'PATCH',
    body: {
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
      email: body.email,
      totpCode: body.totpCode,
    },
    userId: user.id,
  })
  // The email can be set here for accounts that had none, so keep the session in sync
  await setUserSession(event, { user: { ...user, email: updated.email } })
  return { message: updated.message }
})
