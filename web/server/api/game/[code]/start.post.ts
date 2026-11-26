import { defineEventHandler, createError } from "h3";
import type { Game } from "#shared/types/game";

export default defineEventHandler(async (event: any): Promise<Game> => {
	const gameCode = getRouterParam(event, "code");
	const { user } = await requireUserSession(event);

	if (!gameCode)
		throw createError({ message: "Game code is required", status: 400 });
	// try {
	return (callGameService<Game>(`/api/game/${gameCode}/start`, { method: "POST", userId: user.id }));
	// } catch (error: any) {
	// 	console.log(`Error at /api/game/[code]/start.post: ${error.message}`);
	// 	throw Error("Failed to start game data");
	// }
});
