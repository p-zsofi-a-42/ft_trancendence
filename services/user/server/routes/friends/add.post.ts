import { and, or, eq } from 'drizzle-orm'

// Adds a friend request for the authenticated user to the specified user ID
export default defineEventHandler(async (event) => {
  // Read the friend ID from the request body and validate it
  const { id } = await readJsonBody(event)
  if (typeof id !== 'string' || !/^\d+$/.test(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid friend ID' })
  }
  // get the ID of the user making the request and check 
  const ownerId = await getServiceUserId(event)
  if (ownerId === null) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  if (String(ownerId) === id) {
    throw createError({ statusCode: 400, statusMessage: 'You cannot add yourself' })
  }
  // Check if either user has BLOCKED the other
  const blocked = await db.select({ x: blocks.blockerId }).from(blocks).where(
    or(
      and(eq(blocks.blockerId, ownerId), eq(blocks.blockedId, Number(id))),
      and(eq(blocks.blockerId, Number(id)), eq(blocks.blockedId, ownerId)),
    ),
  )
  if (blocked.length > 0){
   /* 403 */ 
   throw createError({ statusCode: 403, statusMessage: 'Friend request not allowed' })
  }

  const friendId = Number(id)

  // Look for an existing friendship row between the two users, in either direction
  const [existing] = await db
    .select({ status: friendships.status, requesterId: friendships.requesterId })
    .from(friendships)
    .where(
      or(
        and(eq(friendships.requesterId, ownerId), eq(friendships.addresseeId, friendId)),
        and(eq(friendships.requesterId, friendId), eq(friendships.addresseeId, ownerId)),
      ),
    )
    .limit(1)

  // IF a friendship already exists, return its status
  if (existing) {
    const isRequester = existing.requesterId === ownerId
    const friendship = existing.status === 'accepted' ? 'friends' : isRequester ? 'outgoing' : 'incoming'
    return { id, friendship }
  }

  // A concurrent request can still slip in between the check and the insert; the unique index rejects it
  try {
    await db.insert(friendships).values({ requesterId: ownerId, addresseeId: Number(id) })
  } catch (err: any) {
    const code = err.code ?? err.cause?.code
    if (code === '23505') { 
      throw createError({ statusCode: 409, statusMessage: 'Friend request already exists' })
    }
    else throw err
  }

  return { id, friendship: 'outgoing' }
})
