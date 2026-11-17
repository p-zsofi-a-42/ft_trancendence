import { defineEventHandler, readBody, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const body = await readBody(event);
	console.log(`body: ${body}`);
	
	// validate
	try {
		return callGameService('/api/foyer/create', { method: 'POST', body: body, userId: user.id});
	} catch (error) {
		console.log(`Error at /api/foyer/create.post: ${error.message}`);
		throw Error("Game creation failed");
	}
});
