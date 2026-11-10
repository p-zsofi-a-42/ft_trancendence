import { eq } from 'drizzle-orm'

// Internal route: only the web service calls this, over the Compose network.
export default defineEventHandler(async (event) => {
  const { name, email, password } = await readJsonBody(event)
  if (
    typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string' ||
    !name || !email || !password
  ) {
    setResponseStatus(event, 400)
    return { message: 'Invalid registration data' }
  }

  const normalizedEmail = email.toLowerCase()
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, normalizedEmail)).limit(1)
  if (existing) {
    setResponseStatus(event, 409)
    return { message: 'Email already registered' }
  }

  const passwordHash = await passwordHasher.make(password)
  const [created] = await db
    .insert(users)
    .values({ name, email: normalizedEmail, passwordHash })
    .returning({ id: users.id })
  return {
    message: 'Registration successful',
    user: { id: String(created.id), name, email: normalizedEmail },
  }
})
