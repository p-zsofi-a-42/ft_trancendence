import { defineHandler, getRequestHeader, getValidatedRouterParams } from "h3";
import { HTTPError } from "nitro";
import z from "zod";
import { eq } from "drizzle-orm"
import { db, games, companies } from "@utils/db";

const validParams = z.object({
	code: z.string().min(6).max(12)
});

/*
 * Get the list of companies that have joined a game, identified by its code
 */
export default defineHandler(async (event) => {
	const routerParams = await getValidatedRouterParams(event, validParams);
	let game = undefined;

	try {
		[game] = await db
			.select({ id: games.id })
			.from(games)
			.where(eq(games.idCode, routerParams.code));
	} catch (error: any) {
		console.log(`Error at /api/game/[code]/companies.get: ${error.message}`);
		throw new HTTPError({ statusMessage: "failed to retrieve game", status: 500 });
	}
	if (!game)
		throw new HTTPError({ statusMessage: "game does not exist", status: 400 });
	try {
		const compList = await db
			.select()
			.from(companies)
			.where(eq(companies.gameId, game.id));
		return (compList);
	} catch (error: any) {
		console.log(`Error at /api/game/[code]/companies.get: ${error.message}`);
		throw new HTTPError({ statusMessage: "failed to retrieve companies", status: 500 });
	}
});
