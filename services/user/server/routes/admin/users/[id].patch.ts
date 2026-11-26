import { updateUserById, parseUserId } from '../../../utils/delete';
import { readJsonBody } from '../../../utils/body';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// admin requests to update a user by ID
export default defineEventHandler(async (event) => {
  const actorId = await requireAdmin(event);

  const userId = parseUserId(getRouterParam(event, 'id'));

  const body = await readJsonBody(event);
  const data: { name?: string; email?: string | null; role?: 'user' | 'admin' } = {};

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.includes('@')) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid name' });
    }
    const name = body.name.trim().toLowerCase();
    if (name.length < 1 || name.length > 64) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid name' });
    }
    data.name = name;
  }

  if (body.email !== undefined) {
    if (body.email === null || body.email === '') {
      data.email = null;
    } else if (typeof body.email === 'string' && body.email.length <= 255 && EMAIL_PATTERN.test(body.email)) {
      data.email = body.email.trim();
    } else {
      throw createError({ statusCode: 400, statusMessage: 'Invalid email' });
    }
  }

  if (body.role !== undefined) {
    if (body.role !== 'user' && body.role !== 'admin') {
      throw createError({ statusCode: 400, statusMessage: 'Invalid role' });
    }
    data.role = body.role;
  }

  if (Object.keys(data).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No valid fields to update' });
  }

  const user = await updateUserById(userId, actorId, data);
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' });
  }

  return user;
});
