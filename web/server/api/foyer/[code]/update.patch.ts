import { defineEventHandler, readBody, createError } from "h3";
import type { Game } from "#shared/types/game";

export default defineEventHandler(async (event: any): Promise<Game> => {
	const gameCode = getRouterParam(event, "code");
	const body = await readBody(event);
	const { user } = await requireUserSession(event);
	console.log(`body: ${body}`);

	if (!gameCode)
		throw createError({ message: "Game code is required", status: 400 });
	// validate
	// try {
	return callGameService<Game>(`/api/game/${gameCode}/update`, { method: "PATCH", body: body, userId: user.id });
	// } catch (error) {
	// 	console.log(`Error at /api/game/update.patch: ${error.message}`);
	// 	throw Error("Game update failed");
	// }
});
