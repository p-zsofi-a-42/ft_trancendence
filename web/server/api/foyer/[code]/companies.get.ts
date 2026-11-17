import { defineEventHandler } from "h3"

export default defineEventHandler(async (event) => {
	const gameCode = getRouterParam(event, "code") ?? "";

	try {
		return callGameService(`/api/foyer/${gameCode}/companies`, { method: "GET" });
	} catch (error) {
		console.log(`Error at /api/foyer/[code]/companies.get: ${error.message}`);
		throw Error("Companies list retrieval failed");
	}
});
