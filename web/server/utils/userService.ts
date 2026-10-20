import { SignJWT } from 'jose'

// Short-lived token that tells the user service which user the request is for.
export async function signServiceToken(userId: number | string) {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(userId))
    .setIssuer('web')
    .setAudience('user')
    .setIssuedAt()
    .setExpirationTime('60s')
    .sign(new TextEncoder().encode(useRuntimeConfig().tokenSecret))
}

export async function callUserService<T>(
  path: string,
  options: { method?: 'GET' | 'POST'; body?: unknown; userId?: number } = {},
): Promise<T> {
  const headers: Record<string, string> = {}
  if (options.userId !== undefined) {
    headers.authorization = `Bearer ${await signServiceToken(options.userId)}`
  }
  try {
    return await $fetch<T>(`${useRuntimeConfig().userServiceUrl}${path}`, {
      method: options.method ?? 'POST',
      body: options.body,
      headers,
    })
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode ?? 502,
      statusMessage: err.data?.message ?? 'User service unavailable',
    })
  }
}
