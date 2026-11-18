import { eq } from 'drizzle-orm'

const MULTIPART_OVERHEAD_BYTES = 64 * 1024

// Replaces the authenticated user's profile picture with the uploaded PNG, JPEG or WebP image.
export default defineEventHandler(async (event) => {
  const userId = await getServiceUserId(event)
  if (userId === null) {
    setResponseStatus(event, 401)
    return { message: 'Unauthorized' }
  }

  const contentLength = Number(getHeader(event, 'content-length') ?? 0)
  if (contentLength > AVATAR_MAX_BYTES + MULTIPART_OVERHEAD_BYTES) {
    setResponseStatus(event, 413)
    return { message: 'Avatar must be 2 MB or smaller' }
  }

  const parts = await readMultipartFormData(event)
  const part = parts?.find(p => p.name === 'avatar')
  if (!part?.data) {
    setResponseStatus(event, 400)
    return { message: 'No avatar file' }
  }
  if (part.data.length > AVATAR_MAX_BYTES) {
    setResponseStatus(event, 413)
    return { message: 'Avatar must be 2 MB or smaller' }
  }

  const type = detectImageType(part.data)
  if (!type) {
    setResponseStatus(event, 415)
    return { message: 'Avatar must be a PNG, JPEG or WebP image' }
  }

  const [current] = await db
    .select({ avatarFile: users.avatarFile })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  if (!current) {
    setResponseStatus(event, 401)
    return { message: 'Unauthorized' }
  }

  const fileName = await saveAvatarFile(part.data, type.ext)
  try {
    await db.update(users).set({ avatarFile: fileName }).where(eq(users.id, userId))
  } catch (err) {
    await removeAvatarFile(fileName)
    throw err
  }

  if (current.avatarFile) {
    await removeAvatarFile(current.avatarFile)
  }
  return { message: 'Avatar updated' }
})
