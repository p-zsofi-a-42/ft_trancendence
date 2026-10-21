export default defineEventHandler(async (event) => {
    // Read the friend ID from the request body
    const { id } = await readJsonBody(event)
    // Ensure the ID is a numeric string
    if (typeof id !== 'string' || !/^\d+$/.test(id)) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid friend ID' })
    }

    // get the ID of the user making the request
    const ownerId = await getServiceUserId(event)
    // Ensure the user logged in and is not trying to add themselves
    if (ownerId === null) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }
    if (String(ownerId) === id) {
        throw createError({ statusCode: 400, statusMessage: 'You cannot add yourself' })
    }

    // Look for an existing row between the two users, in either direction
    const existing = await pool.query(
        `SELECT status, requester_id = $1 AS is_requester
         FROM friendships
         WHERE (requester_id = $1 AND addressee_id = $2)
            OR (requester_id = $2 AND addressee_id = $1)`,
        [ownerId, id],
    )
    // If a friendship already exists, return its status
    if (existing.rows.length > 0) {
        const { status, is_requester } = existing.rows[0]
        // Determine the friendship status based on the existing row and the requester
        const friendship = status === 'accepted' ? 'friends' : is_requester ? 'not accepted' : 'incoming'
        return { id, status: friendship }
    }

    // A concurrent request can still slip in between the check and the insert; the unique index rejects it
    try {
        await pool.query(
            'INSERT INTO friendships (requester_id, addressee_id) VALUES ($1, $2)',
            [ownerId, id],
        )
    } catch (err: any) {
        if (err.code === '23505') {
            throw createError({ statusCode: 409, statusMessage: 'Friendship already exists' })
        }
        throw err
    }

    return { id, status: 'requested friendship' }
})
