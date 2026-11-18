// Route for fetching all users as an admin. Requires the requester to be an admin.
// paginated list
import { requireAdmin } from '~/utils/auth'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // Ensure the requester is an admin
  // throw createError({ statusCode: 401, statusMessage: 'Unauthorized Backend' })
  try {
    await requireAdmin(event)
  } catch (error) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized Backend' })
  }

// ask: what do the pages represent? They are used for pagination, indicating which page of results to fetch.
  // const page = Number(getQuery(event).page ?? 1)
  // const pageSize = Number(getQuery(event).pageSize ?? 10)
  // const offset = (page - 1) * pageSize

  // Fetch the paginated list of users from the database
  // Later we might include additional filtering or sorting options for the user list
  const allUsers = await db.select().from(users)
  if (allUsers.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'No users found' })
  }
  return allUsers
})