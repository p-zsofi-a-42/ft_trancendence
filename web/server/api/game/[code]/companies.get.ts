import { defineEventHandler } from "h3";
import { Company } from "#shared/types/game";

export default defineEventHandler(async (event: any): Promise<Company[]> => {
	const gameCode = getRouterParam(event, "code");

	if (!gameCode)
		throw createError({ message: "Game code is required", status: 400 });
	// try {
	return callGameService<Company[]>(`/api/game/${gameCode}/companies`, { method: "GET" });
	// } catch (error) {
	// 	console.log(`Error at /api/game/[code]/companies.get: ${error.message}`);
	// 	throw Error("Companies list retrieval failed");
	// }
});
