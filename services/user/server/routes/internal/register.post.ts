import { eq } from 'drizzle-orm'

// Internal route: only the web service calls this, over the Compose network.
export default defineEventHandler(async (event) => {
  const { name, email, password } = await readJsonBody(event)
  if (
    typeof name !== 'string' || (email !== undefined && typeof email !== 'string') || typeof password !== 'string' ||
    !name || !password
  ) {
    setResponseStatus(event, 400)
    return { message: 'Invalid registration data' }
  }

  const normalizedName = name.toLowerCase()
  if (normalizedName) {
    // # ask db if name exists
    const [existingName] = await db.select({ id: users.id }).from(users).where(eq(users.name, normalizedName)).limit(1)
    if (existingName) {
      setResponseStatus(event, 409)
      return { message: 'Username already taken' }
    }
  }

  // Email handling
  const hasEmail = email && typeof email === 'string' && email.trim() !== ''
  const passwordHash = await passwordHasher.make(password)
  const [created] = await db
    .insert(users)
    // handle email in .values?
    .values({ name: name, email: hasEmail ? email : '', passwordHash })
    .returning({ id: users.id })
  return {
    message: 'Registration successful',
    user: { id: String(created.id), name: name, email: email ?? '' },
  }
})
