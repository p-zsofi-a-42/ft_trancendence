import { deleteUserById } from '../../../utils/delete';

export default defineEventHandler(async (event) => {
// throw createError({ statusCode: 401, statusMessage: 'Un' });
  // const { id } = await readJsonBody(event);
  // if (!id) {
  //   throw createError({ statusCode: 400, statusMessage: 'User ID is required' });
  // }

  // check if the user has admin privileges
  try {
    await requireAdmin(event)
  } catch (error) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized Backend' })
  }

  // retrieve the user ID from the router parameters
  const userId = getRouterParam(event, 'id');
  
  const [deletedUser] = await deleteUserById(userId);
  if (!deletedUser) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' });
  }

  // Add your user deletion logic here
  return { success: true };
});