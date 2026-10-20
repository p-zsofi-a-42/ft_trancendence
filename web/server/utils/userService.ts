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

// Calls the user service with the appropriate authorization header.
// 1. path: the endpoint path to call on the user service.
// 2. options: an object containing optional method, body, and userId.
// 3. Returns a Promise resolving to the response of type T.
export async function callUserService<T>(
  path: string,
  options: { method?: 'GET' | 'POST'; body?: Record<string, unknown>; userId?: number } = {},
): Promise<T> {
  const headers: Record<string, string> = {}
  if (options.userId !== undefined) {
    headers.authorization = `Bearer ${await signServiceToken(options.userId)}`
  }
  try {
    const res: unknown = await $fetch(`${useRuntimeConfig().userServiceUrl}${path}`, {
      method: options.method ?? 'POST',
      body: options.body,
      headers,
    })
    return res as T
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode ?? 502,
      statusMessage: err.data?.message ?? 'User service unavailable',
    })
  }
}
