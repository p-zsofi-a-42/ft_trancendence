import { eq } from 'drizzle-orm'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Updates the authenticated user's name and/or email. Omitted fields stay unchanged; an empty email clears it.
export default defineEventHandler(async (event) => {
  const userId = await getServiceUserId(event)
  if (userId === null) {
    setResponseStatus(event, 401)
    return { message: 'Unauthorized' }
  }

  const { name, email } = await readJsonBody(event)
  const updates: { name?: string; email?: string | null } = {}

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim() === '') {
      setResponseStatus(event, 400)
      return { message: 'Invalid name' }
    }
    // Lowercased like registration, so uniqueness is case-insensitive
    updates.name = name.trim().toLowerCase()
  }

  if (email !== undefined) {
    if (email === null || email === '') {
      updates.email = null
    } else if (typeof email !== 'string' || !EMAIL_PATTERN.test(email.trim())) {
      setResponseStatus(event, 400)
      return { message: 'Invalid email' }
    } else {
      updates.email = email.trim()
    }
  }

  if (Object.keys(updates).length === 0) {
    setResponseStatus(event, 400)
    return { message: 'Nothing to update' }
  }

  try {
    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning({ id: users.id, name: users.name, email: users.email })
    if (!updated) {
      setResponseStatus(event, 401)
      return { message: 'Unauthorized' }
    }
    return { ...updated, id: String(updated.id) }
  } catch (err: any) {
    // The unique index on users.name rejects a name taken by another user (also covers concurrent renames)
    const code = err.code ?? err.cause?.code
    if (code === '23505') {
      setResponseStatus(event, 409)
      return { message: 'Username already taken' }
    }
    throw err
  }
})
