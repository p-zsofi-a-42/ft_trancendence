// Internal route: only the web service calls this, over the Compose network.
export default defineEventHandler(async (event) => {
  const { email, password } = await readJsonBody(event)
  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    setResponseStatus(event, 400)
    return { message: 'Invalid login data' }
  }

  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()])
  const user = rows[0]
  if (!user || !(await passwordHasher.verify(user.password_hash, password))) {
    setResponseStatus(event, 401)
    return { message: 'Invalid email or password' }
  }
  return {
    message: 'Login successful',
    user: { id: user.id, name: user.name, email: user.email },
  }
})
