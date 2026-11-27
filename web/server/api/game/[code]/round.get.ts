import { defineEventHandler, createError } from "h3";

export default defineEventHandler(async (event: any): Promise<any> => {
	const gameCode = getRouterParam(event, "code");

	if (!gameCode)
		throw createError({ message: "Game code is required", status: 400 });
	// try {
	return (callGameService<any>(`/api/game/${gameCode}/round`, { method: "GET" }));
	// } catch (error: any) {
	// 	console.log(`Error at /api/game/[code]/index.get: ${error.message}`);
	// 	throw Error("Failed to retrieve game data");
	// }
});
