// API endpoint to unblock a user
// Handles the POST request to unblock a user by calling the user service with the appropriate parameters.
import type { BlockedUser } from '#shared/types/friends'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const { id } = await readBody(event)
  return callUserService<BlockedUser>('/blocks/unblock', { body: { id }, userId: user.id })
})