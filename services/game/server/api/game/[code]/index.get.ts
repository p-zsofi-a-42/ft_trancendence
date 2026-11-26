import { defineHandler, getRequestHeader, getValidatedRouterParams } from "h3";
import { HTTPError } from "nitro";
import z from "zod";
import { eq } from "drizzle-orm"
import { db, games, Game } from "@utils/db";

const validParams = z.object({
	code: z.string().min(6).max(12)
});

export default defineHandler(async (event) => {
	const routerParams = await getValidatedRouterParams(event, validParams);
	let game: Game = undefined;

	try {
		[game] = await db
			.select()
			.from(games)
			.where(eq(games.idCode, routerParams.code));
	} catch (error: any) {
		console.log(`Error at /api/game/[code]/index.get: ${error.message}`);
		throw new HTTPError({ statusMessage: "failed to retrieve game", status: 500 });
	}
	if (!game)
		throw new HTTPError({ statusMessage: "game not found", status: 404 });
	return (game);
});
