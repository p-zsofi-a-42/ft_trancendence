import { db } from './db';
import { eq } from 'drizzle-orm';
import { users } from './schema';

// Explicit column list so credential fields (password_hash, totp_secret) never leave the service
export const publicUserColumns = {
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
  createdAt: users.createdAt,
  totpEnabled: users.totpEnabled,
};

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export function parseUserId(raw: unknown): number {
  if (typeof raw !== 'string' || !/^\d+$/.test(raw) || !Number.isSafeInteger(Number(raw)) || Number(raw) < 1) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid user ID' });
  }
  return Number(raw);
}

// Locks all admin rows so concurrent demotions/deletions cannot both remove the last admin.
async function ensureAdminRemains(tx: Transaction, targetId: number) {
  const admins = await tx
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, 'admin'))
    .for('update');
  if (admins.some((admin) => admin.id === targetId) && admins.length <= 1) {
    throw createError({ statusCode: 409, statusMessage: 'Cannot remove the last administrator' });
  }
}

export async function getUserById(userId: number) {
  const [user = null] = await db
    .select(publicUserColumns)
    .from(users)
    .where(eq(users.id, userId));

  return user;
}

export async function deleteUserById(userId: number, actorId: number) {
  if (userId === actorId) {
    throw createError({ statusCode: 409, statusMessage: 'You cannot delete your own account' });
  }
  return db.transaction(async (tx) => {
    await ensureAdminRemains(tx, userId);
    const [deletedUser = null] = await tx
      .delete(users)
      .where(eq(users.id, userId))
      .returning(publicUserColumns);
    return deletedUser;
  });
}

export async function updateUserById(
  userId: number,
  actorId: number,
  data: { name?: string; email?: string | null; role?: 'user' | 'admin' },
) {
  if (userId === actorId && data.role !== undefined && data.role !== 'admin') {
    throw createError({ statusCode: 409, statusMessage: 'You cannot demote your own account' });
  }
  try {
    return await db.transaction(async (tx) => {
      if (data.role === 'user') {
        await ensureAdminRemains(tx, userId);
      }
      const [updatedUser = null] = await tx
        .update(users)
        .set(data)
        .where(eq(users.id, userId))
        .returning(publicUserColumns);
      return updatedUser;
    });
  } catch (err: any) {
    // Postgres unique_violation on users.name; drizzle wraps the driver error in `cause`
    if ((err.cause?.code ?? err.code) === '23505') {
      throw createError({ statusCode: 409, statusMessage: 'Username already taken' });
    }
    throw err;
  }
}