import { defineHandler, getRequestHeader, getValidatedRouterParams, createError } from "h3";
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

	const [game] = await db
		.select({ id: games.id })
		.from(games)
		.where(eq(games.idCode, routerParams.code));
	if (!game.id)
		throw Error(`game code does not exist (${routerParams.code})`);
	const compList = await db
		.select()
		.from(companies)
		.where(eq(companies.gameId, game.id));
	return (compList);
});
