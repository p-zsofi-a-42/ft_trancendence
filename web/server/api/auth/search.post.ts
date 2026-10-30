import type { SearchResult } from '#shared/types/friends'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const body = await readBody(event)
  return callUserService<SearchResult[]>('/users/search', { body, userId: user.id })
})
