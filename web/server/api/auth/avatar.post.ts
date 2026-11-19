const AVATAR_MAX_BYTES = 2 * 1024 * 1024
const MULTIPART_OVERHEAD_BYTES = 64 * 1024

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const contentLength = Number(getHeader(event, 'content-length') ?? 0)
  if (contentLength > AVATAR_MAX_BYTES + MULTIPART_OVERHEAD_BYTES) {
    throw createError({ statusCode: 413, statusMessage: 'Avatar must be 2 MB or smaller' })
  }

  const parts = await readMultipartFormData(event)
  const part = parts?.find(p => p.name === 'avatar')
  if (!part?.data) {
    throw createError({ statusCode: 400, statusMessage: 'No avatar file' })
  }
  if (part.data.length > AVATAR_MAX_BYTES) {
    throw createError({ statusCode: 413, statusMessage: 'Avatar must be 2 MB or smaller' })
  }
  // Re-sent as multipart because the user service only sees the Compose network, not the browser
  const form = new FormData()
  form.append('avatar', new Blob([part.data], { type: part.type ?? 'application/octet-stream' }), part.filename ?? 'avatar')
  return callUserService<{ message: string }>('/users/me/avatar', { method: 'POST', body: form, userId: user.id })
})
