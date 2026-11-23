import { db } from './db';
import { eq} from 'drizzle-orm';
import { users } from './schema';

export async function deleteUserById(id: string) {
  const userId = Number(id);
  // Add your user deletion logic here
  // Return an array with the deleted user or an empty array if not found
  const [deletedUser = null] = await db
  	.delete(users)
    .where(
	  eq(users.id, userId)
	)
	.returning();
  // });

  return deletedUser ? [deletedUser] : [];
}

export async function getUserById(id: string) {
  const userId = Number(id);
  const [user = null] = await db
    .select( { id: users.id, name: users.name, email: users.email, role: users.role  } )
    .from(users)
    .where(
      eq(users.id, userId)
    );

  return user ? [user] : [];
}

export async function updateUserById(id: string, data: { name?: string; email?: string; role?: string }) {
  const userId = Number(id);
  const [updatedUser = null] = await db
    .update(users)
    .set({
      name: data.name,
      email: data.email,
      role: data.role as 'user' | 'admin' | undefined,
    })
    .where(
      eq(users.id, userId)
    )
    .returning();

  return updatedUser ? [updatedUser] : [];
}