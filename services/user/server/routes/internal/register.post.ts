// Route for user registration

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
  const normalizedName = name.toLowerCase()
  // Determine if a valid email was provided and normalize it if so
  let normalizedEmail: string | null = null
  if (email && (typeof email !== 'string' || !email.includes('@') || email.trim() === '')) {
    setResponseStatus(event, 400)
    return { message: 'Invalid email' }
  }
  const hasEmail = email && typeof email === 'string' && email.trim() !== ''
  if (hasEmail) {
    normalizedEmail = email.toLowerCase().trim()
  }
  // Hash the password for secure storage
  const passwordHash = await passwordHasher.make(password)
  // Insert the new user into the database
  try {
    const [created] = await db
    .insert(users)
    .values({ name: normalizedName, email: normalizedEmail, passwordHash })
    .returning({ id: users.id })

    return {
      message: 'Registration successful',
      user: { id: String(created.id), name: normalizedName, email: normalizedEmail },
    }
  } catch (error) {
    // error handling for unique constraint violations and other database errors
    // Constraint names come from db/schema.sql (Postgres default: <table>_<column>_key)
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
    }
    setResponseStatus(event, 500)
    return { message: 'Failed to create user' }
  }
})
