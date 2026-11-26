import { eq } from 'drizzle-orm'

// Internal route: only the web service calls this, over the Compose network.
// User login either by username or email
export default defineEventHandler(async (event) => {
  // User will either put username or email along with the password
  // Read the field and decide which one to use for login (username or email)
  const { login, password } = await readJsonBody(event)
  // accept either username or email for login
  if (typeof login !== 'string' || !login.trim()
    || typeof password !== 'string' || !password) {
    setResponseStatus(event, 400)
    return { message: 'Invalid login data' }
  }
  // trim whitespace from login input
  const trimmedLogin = login.trim()
  // normalize email and username to lowercase for consistent comparison
  let cleanEmail: string | undefined
  if (trimmedLogin && typeof trimmedLogin === 'string' && trimmedLogin.includes('@'))
    cleanEmail = trimmedLogin.toLowerCase()
  let cleanUsername: string | undefined
  if (trimmedLogin && typeof trimmedLogin === 'string' && !trimmedLogin.includes('@'))
    cleanUsername = trimmedLogin.toLowerCase()

  // query the user TABLE by normalized username or email
  const [user] = await db.select().from(users).where(
    cleanUsername ? eq(users.name, cleanUsername) : eq(users.email, cleanEmail)
  ).limit(1)
  // OAuth-only accounts have no password; reject them here instead of hashing against null
  if (!user || !user.passwordHash || !(await passwordHasher.verify(user.passwordHash, password))) {
    setResponseStatus(event, 401)
    return { message: 'Invalid username or password' }
  }
  return {
    message: 'Login successful',
    user: { id: String(user.id), name: user.name, email: user.email },
    totpRequired: user.totpEnabled, // BFF must call verify.post.ts before issuing a session if true
    role: user.role
  }
})
