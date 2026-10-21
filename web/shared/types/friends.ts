// Types related to friends and friendship status

// Defines the types used for representing friendship status and search results for friends.
export type FriendshipStatus = 'none' | 'outgoing' | 'incoming' | 'friends' | 'self'

// Represents the result of a user search, including their friendship status.
export interface SearchResult {
  id: string
  name: string
  friendship: FriendshipStatus
}
