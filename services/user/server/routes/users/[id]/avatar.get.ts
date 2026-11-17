import { eq } from 'drizzle-orm'
import { readFile } from 'node:fs/promises'

// Serves a user's profile picture. Any authenticated user can view it; 404 when the user has none.
export default defineEventHandler(async (event) => {
  const requesterId = await getServiceUserId(event)
  if (requesterId === null) {
    setResponseStatus(event, 401)
    return { message: 'Unauthorized' }
  }

  const id = getRouterParam(event, 'id') ?? ''
  if (!/^\d+$/.test(id)) {
    setResponseStatus(event, 400)
    return { message: 'Invalid user ID' }
  }

  const [user] = await db
    .select({ avatarFile: users.avatarFile })
    .from(users)
    .where(eq(users.id, Number(id)))
    .limit(1)
  const mime = user?.avatarFile ? mimeForAvatarFile(user.avatarFile) : null
  const data = user?.avatarFile && mime
    ? await readFile(avatarFilePath(user.avatarFile)).catch(() => null)
    : null
  if (!data) {
    setResponseStatus(event, 404)
    return { message: 'No avatar' }
  }

  setResponseHeader(event, 'content-type', mime!)
  setResponseHeader(event, 'cache-control', 'private, no-cache')
  return data
})
