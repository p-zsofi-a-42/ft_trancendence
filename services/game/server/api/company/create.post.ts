import { defineHandler, getRequestHeader, readValidatedBody, createError } from "h3";
import z from "zod";
import { db, companies } from "@utils/db";

const validInput = z.strictObject({
	gameId: z.coerce.bigint().min(1),
	name: z.string().min(1).max(20)
});

export default defineHandler(async (event) => {
	const userId = z.coerce.bigint().min(1).parse(getRequestHeader(event, "user-id"));
	const body = await readValidatedBody(event, validInput.parse);

	try {
		const [ row ] = await db
			.insert(companies)
			.values({...body, userId: userId})
			.returning();
		return (row);
	} catch (error) {
		console.log(`Error at /api/company/create.post: ${error.message}`);
		throw createError({
			statusCode: 500,
			statusMessage: "Company creation failed"
		});
	}
});
