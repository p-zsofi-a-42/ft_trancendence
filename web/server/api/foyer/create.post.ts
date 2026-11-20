import { defineEventHandler, readBody, createError } from "h3";
import { Game } from "#shared/types/game";

export default defineEventHandler(async (event: any): Promise<Game> => {
	const { user } = await requireUserSession(event);
	const body = await readBody(event);
	console.log(`body: ${body}`);

	// validate
	return callGameService<Game>("/api/game/create", { method: "POST", body: body, userId: user.id });
	// try {
	// } catch (error) {
	// 	console.log(`Error at /api/foyer/create.post: ${error.message}`);
	// 	throw Error("Game creation failed");
	// }
});
