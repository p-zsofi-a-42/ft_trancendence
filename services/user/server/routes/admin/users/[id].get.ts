import { getUserById, parseUserId } from '../../../utils/delete';

// admin requests users by ID
export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const userId = parseUserId(getRouterParam(event, 'id'));

  const user = await getUserById(userId);
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' });
  }

  return user;
});
