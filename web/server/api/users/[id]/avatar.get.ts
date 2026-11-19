const DEFAULT_AVATAR = '/avatars/default.svg'

// Serves a user's profile picture, or redirects to the default avatar when the user has none.
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const id = getRouterParam(event, 'id') ?? ''
  if (!/^\d+$/.test(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid user ID' })
  }

  const avatar = await fetchUserServiceFile(`/users/${id}/avatar`, user.id)
  if (!avatar) {
    return sendRedirect(event, DEFAULT_AVATAR, 302)
  }
  setResponseHeader(event, 'content-type', avatar.type)
  setResponseHeader(event, 'cache-control', 'private, no-cache')
  return Buffer.from(avatar.data)
})
