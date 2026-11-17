import { defineEventHandler } from "h3"

export default defineEventHandler(async (event) => {
	const gameCode = getRouterParam(event, "code") ?? "";
	console.log("hello", gameCode);

	return callGameService(`/api/foyer/${gameCode}/companies`, { method: "GET" });
});
