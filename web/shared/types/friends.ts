// Types related to friends and friendship status

// Defines the types used for representing friendship status and search results for friends.
export type FriendshipStatus =
  | "none"
  | "outgoing"
  | "incoming"
  | "friends"
  | "self";

// Represents the result of a user search, including their friendship status.
export interface SearchResult {
  id: string;
  name: string;
  friendship: FriendshipStatus;
}

// Friendship states that exist in a stored friendship row (the user-service list and add/accept responses).
export type ActiveFriendshipStatus = "friends" | "outgoing" | "incoming";

// A base type for users to be inherited by other types
export interface UserSummary {
  id: string;
  name: string;
}

// One row of the friend list returned by GET /friends.
export interface FriendEntry extends UserSummary {
  friendship: ActiveFriendshipStatus;
}

// Represents a user that has been blocked by the authenticated user.
export interface BlockedUser extends UserSummary {}

// Response of POST /friends/add and POST /friends/accept.
export interface FriendshipResult {
  id: string;
  friendship: ActiveFriendshipStatus;
}
