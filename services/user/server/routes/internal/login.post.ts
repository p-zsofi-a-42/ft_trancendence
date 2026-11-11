import { eq } from 'drizzle-orm'

// Internal route: only the web service calls this, over the Compose network.
export default defineEventHandler(async (event) => {
  const { username, password } = await readJsonBody(event)
  if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
    setResponseStatus(event, 400)
    return { message: 'Invalid login data' }
  }

  const [user] = await db.select().from(users).where(eq(users.name, username.toLowerCase())).limit(1)
  if (!user || !(await passwordHasher.verify(user.passwordHash, password))) {
    setResponseStatus(event, 401)
    return { message: 'Invalid username or password' }
  }
  return {
    message: 'Login successful',
    user: { id: String(user.id), name: user.name, email: user.email },
    totpRequired: user.totpEnabled, // BFF must call verify.post.ts before issuing a session if true
  }
})
