import { deleteUserById, parseUserId } from '../../../utils/delete';

export default defineEventHandler(async (event) => {
  const actorId = await requireAdmin(event);

  const userId = parseUserId(getRouterParam(event, 'id'));

  const deletedUser = await deleteUserById(userId, actorId);
  if (!deletedUser) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' });
  }

  return { success: true };
});