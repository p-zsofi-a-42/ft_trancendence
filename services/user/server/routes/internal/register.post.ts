// Internal route: only the web service calls this, over the Compose network.
import { eq } from 'drizzle-orm'

/**
 * Reads Json body (name, email, password) from the request.
 * Validates the input and ensures the username is unique.
 * Hashes the password and inserts the new user into the database.
 * Returns a success message and the created user's information.
 */
export default defineEventHandler(async (event) => {
  const { name, email, password } = await readJsonBody(event)
  if (typeof name !== 'string' || !name
    || (email !== undefined && typeof email !== 'string')
    || typeof password !== 'string' || !password)
  {
    setResponseStatus(event, 400)
    return { message: 'Invalid registration data' }
  }
  // Normalize the username to lowercase for consistent uniqueness checks,
  // then check if it already exists in the database
  const normalizedName = name.toLowerCase()
  if (normalizedName) {
    const [existingName] = await db.select({ id: users.id }).from(users).where(eq(users.name, normalizedName)).limit(1)
    if (existingName) {
      setResponseStatus(event, 409)
      return { message: 'Username already taken' }
    }
  }
  // Hash the password for secure storage
  const passwordHash = await passwordHasher.make(password)
  // Determine if a valid email was provided
  const hasEmail = email && typeof email === 'string' && email.trim() !== ''
  // Insert the new user into the database
  const [created] = await db
    .insert(users)
    .values({ name: normalizedName, email: hasEmail ? email : null, passwordHash })
    .returning({ id: users.id })
  if (!created) {
    setResponseStatus(event, 500)
    return { message: 'Failed to create user' }
  }
  return {
    message: 'Registration successful',
    user: { id: String(created.id), name: name, email: hasEmail ? email : null },
  }
})
