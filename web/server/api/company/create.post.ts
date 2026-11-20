import { defineEventHandler, readBody, createError } from "h3"
import { Company } from "#shared/types/game";

export default defineEventHandler(async (event: any): Promise<Company> => {
	const { user } = await requireUserSession(event);
	const body = await readBody(event);
	console.log(`body: ${JSON.stringify(body)}`);

	// validate
	// try {
	return callGameService<Company>('/api/company/create', { method: 'POST', body: body, userId: user.id });
	// } catch (error) {
	// 	console.log(`Error at /api/company/create.post: ${error.message}`);
	// 	throw Error(error.statusCode === 409 && error.statusMessage ? error.statusMessage : "Company creation failed");
	// }
});
