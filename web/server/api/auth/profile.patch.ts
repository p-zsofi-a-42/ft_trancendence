export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const body = (await readBody<{ name?: unknown; email?: unknown }>(event)) ?? {}
  const updated = await callUserService<{ id: string; name: string; email: string | null }>('/users/me', {
    method: 'PATCH',
    body: { name: body.name, email: body.email },
    userId: user.id,
  })
  // Keep the navbar and session in sync with the new name and email
  await setUserSession(event, { user: { ...user, name: updated.name, email: updated.email } })
  return updated
})
