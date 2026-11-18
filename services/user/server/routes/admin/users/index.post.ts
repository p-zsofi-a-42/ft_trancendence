// Route for creating a new user as an admin. Requires the requester to be an admin.
import { requireAdmin } from '~/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event)
  } catch (error) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readBody(event)
  // Here you would typically validate the body and create the new user in the database
  body.username = body.username.trim()
  if (!body || !body.username || !body.email || body.username.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request body' })
  }
  // Insert the new user into the database
  const newUser = await db.insert(users).values({
    name: body.username,
    email: body.email,
    // Add other fields as necessary
  }).returning()
  return newUser
})