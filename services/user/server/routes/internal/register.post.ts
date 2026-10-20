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
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail])
  if (existing.rows.length > 0) {
    setResponseStatus(event, 409)
    return { message: 'Email already registered' }
  }

  const passwordHash = await passwordHasher.make(password)
  const { rows } = await pool.query(
    'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
    [name, normalizedEmail, passwordHash],
  )
  return {
    message: 'Registration successful',
    user: { id: rows[0].id, name, email: normalizedEmail },
  }
})
