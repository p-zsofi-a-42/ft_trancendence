import { inArray } from "drizzle-orm";

export default defineEventHandler(async (event) => {
	const body = await readBody(event);

	try {
		console.log(`body: ${JSON.stringify(body)}`);

		const userList = await db.query.users
			.findMany({
				where: inArray(users.id, body.userIds)
			});
		return (userList);
	} catch (error: any) {
		console.log(`Error at /api/users/players.post: ${error.message}`);
		throw createError({ message: "failed to retrieve users", status: 500 });
	}
});
