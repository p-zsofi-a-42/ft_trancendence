import { eq } from 'drizzle-orm'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8

// Sets or changes the authenticated user's password. Changing an existing password needs the current one,
// and a TOTP code too when 2FA is enabled. An account without an email must supply one (the DB requires
// an email for any password account). Email is ignored when the account already has one.
export default defineEventHandler(async (event) => {
  const userId = await getServiceUserId(event)
  if (userId === null) {
    setResponseStatus(event, 401)
    return { message: 'Unauthorized' }
  }

  const { currentPassword, newPassword, email, totpCode } = await readJsonBody(event)
  if (typeof newPassword !== 'string' || newPassword.length < MIN_PASSWORD_LENGTH) {
    setResponseStatus(event, 400)
    return { message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` }
  }

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!user) {
    setResponseStatus(event, 404)
    return { message: 'User not found' }
  }

  if (user.passwordHash) {
    if (typeof currentPassword !== 'string' || !currentPassword) {
      setResponseStatus(event, 400)
      return { message: 'Current password is required' }
    }
    if (!(await passwordHasher.verify(user.passwordHash, currentPassword))) {
      setResponseStatus(event, 400)
      return { message: 'Current password is incorrect' }
    }
  }

  if (user.totpEnabled) {
    if (typeof totpCode !== 'string' || !totpCode || !user.totpSecret || !verifyTotpCode(user.totpSecret, totpCode)) {
      setResponseStatus(event, 400)
      return { message: 'Invalid TOTP code' }
    }
  }

  let nextEmail = user.email
  if (!user.email) {
    if (typeof email !== 'string' || !EMAIL_PATTERN.test(email.trim())) {
      setResponseStatus(event, 400)
      return { message: 'A valid email is required to set a password' }
    }
    nextEmail = email.trim().toLowerCase()
  }

  try {
    const [updated] = await db
      .update(users)
      .set({ passwordHash: await passwordHasher.make(newPassword), email: nextEmail })
      .where(eq(users.id, user.id))
      .returning({ email: users.email })
    return { message: 'Password updated', email: updated.email }
  } catch (err: any) {
    // The only unique column written here is email
    if ((err.code ?? err.cause?.code) === '23505') {
      setResponseStatus(event, 409)
      return { message: 'Email already taken' }
    }
    throw err
  }
})
