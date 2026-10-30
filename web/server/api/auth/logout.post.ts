// event handler for logging out the user
export default defineEventHandler(async (event) => {
  // Clear the user's session
  await clearUserSession(event)
  return { message: 'Logged out successfully'}
})