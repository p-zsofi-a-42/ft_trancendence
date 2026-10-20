// Forwards login to the user service. Only this route creates the Nuxt session.
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { user } = await callUserService<{ message: string; user: { id: string; name: string; email: string } }>(
    '/internal/login',
    { body },
  )
  await setUserSession(event, { user })
  return { message: 'Login successful', user }
})
