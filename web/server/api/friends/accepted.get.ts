import type { FriendEntry } from '#shared/types/friends'

/**
 * Get the list of accepted friends for the current user
 */
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const friends = await callUserService<FriendEntry[]>(
	'/friends',
	{ method: 'GET', userId: user.id },
  )
  // Filter the friends to only include accepted ones
  const acceptedFriends = friends.filter(friend => friend.friendship === 'friends')
  return acceptedFriends
})