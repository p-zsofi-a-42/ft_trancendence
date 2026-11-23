import { defineEventHandler, createError } from "h3";
import type { Game } from "#shared/types/game";

export default defineEventHandler(async (event: any): Promise<Game> => {
	const gameCode = getRouterParam(event, "code");

	if (!gameCode)
		throw createError({ message: "Game code is required", status: 400 });
	// try {
	return (callGameService<Game>(`/api/game/${gameCode}`, { method: "GET" }));
	// } catch (error: any) {
	// 	console.log(`Error at /api/game/[code]/index.get: ${error.message}`);
	// 	throw Error("Failed to retrieve game data");
	// }
});
