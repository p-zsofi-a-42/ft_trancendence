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
  if (typeof name !== 'string' || !name || name.includes('@')
    || (!email && typeof email !== 'string')
    || typeof password !== 'string' || !password)
  {
    setResponseStatus(event, 400)
    return { message: 'Invalid registration data' }
  }
  // Normalize the username to lowercase for consistent uniqueness checks,
  // then check if it already exists in the database
  const normalizedName = name.toLowerCase()
  // if (normalizedName) {
  //   const [existingName] = await db.select({ id: users.id }).from(users).where(eq(users.name, normalizedName)).limit(1)
  //   if (existingName) {
  //     setResponseStatus(event, 409)
  //     return { message: 'Username already taken' }
  //   }
  // }
  
  // Determine if a valid email was provided, should have '@' character,
  // not be empty if provided
  let normalizedEmail: string | null = null
  if (email && (typeof email !== 'string' || !email.includes('@') || email.trim() === '')) {
    setResponseStatus(event, 400)
    return { message: 'Invalid email' }
  } 
  const hasEmail = email && typeof email === 'string' && email.trim() !== ''
  if (hasEmail) {
    normalizedEmail = email.toLowerCase().trim()
  }
  // if (normalizedEmail) {
  //   const [existingEmail] = await db.select({ id: users.id }).from(users).where(eq(users.email, normalizedEmail)).limit(1)
  //   if (existingEmail) {
  //     setResponseStatus(event, 409)
  //     return { message: 'Email already taken' }
  //   }
  // }
  // Hash the password for secure storage
  const passwordHash = await passwordHasher.make(password)
  // Insert the new user into the database
  try {
    const [created] = await db
    .insert(users)
    .values({ name: normalizedName, email: normalizedEmail, passwordHash })
    .returning({ id: users.id })
    if (!created) {
      setResponseStatus(event, 500)
      return { message: 'Failed to create user' }
    }
    return {
      message: 'Registration successful',
      user: { id: String(created.id), name: name, email: normalizedEmail },
    }
  } catch (error) {
      if ((error.code ?? error.cause?.code) === '23505') {
        const constraint = error.constraint ?? error.cause?.constraint
        if (constraint === 'users_name_key') {
          setResponseStatus(event, 409)
          return { message: 'Username already taken' }
        }
        if (constraint === 'users_email_key') {
          setResponseStatus(event, 409)
          return { message: 'Email already taken' }
        }
        setResponseStatus(event, 409)
        return { message: 'Failed to create user due to unique constraint violation' }
    }
    setResponseStatus(event, 500)
    return { message: 'Failed to create user' }
  }
})
