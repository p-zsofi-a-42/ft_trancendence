import type { H3Event } from 'h3'

// Invalid or empty JSON becomes an empty object so each route can return its own 400.
export async function readJsonBody(event: H3Event): Promise<Record<string, unknown>> {
  return ((await readBody(event).catch(() => null)) ?? {}) as Record<string, unknown>
}
