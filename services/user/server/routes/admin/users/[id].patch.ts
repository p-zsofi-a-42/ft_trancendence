import { updateUserById } from '../../../utils/delete';

// admin requests to update a user by ID
export default defineEventHandler(async (event) => {
  try {
	await requireAdmin(event)
  } catch (error) {
	throw createError({ statusCode: 401, statusMessage: 'Unauthorized Backend' })
  }

  const userId = getRouterParam(event, 'id');
  if (!userId) {
	throw createError({ statusCode: 400, statusMessage: 'User ID is required' });
  }

  const body = await readBody(event);
  const [user] = await updateUserById(userId, body);
  if (!user) {
	throw createError({ statusCode: 404, statusMessage: 'User not found' });
  }

  return user;
});
