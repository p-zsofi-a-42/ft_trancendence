import { defineEventHandler, readBody, createError } from 'h3'

export default defineEventHandler(async (event) => {
	const gameCode = getRouterParam(event, "code");
  const body = await readBody(event);
  const { user } = await requireUserSession(event);
	console.log(`body: ${body}`);
	
	// validate
	try {
		return callGameService(`/api/foyer/${gameCode}/update`, { method: "PATCH", body: body, userId: user.id});
	} catch (error) {
		console.log(`Error at /api/foyer/update.patch: ${error.message}`);
		throw Error("Game update failed");
	}
});
