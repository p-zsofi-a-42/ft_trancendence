import { defineHandler, createError, getRequestHeader, readValidatedBody,
	getValidatedRouterParams } from "h3";
import z from "zod";
import { and, eq } from "drizzle-orm";
import { games, db } from "@utils/db";

const validParams = z.object({
	gameId: z.coerce.bigint().min(1)
});

const validInput = z.strictObject({
	n_players: z.number().int().min(1).max(5),
	n_rounds: z.number().int().min(1).max(40),
	seed_capital: z.bigint().min(100_000).max(10_000_000)
}).partial();

// identify
//  - the game via the route param
//  - and the user by the header variable x-user-id
// the request body represents all the fields that the user wants to update
export default defineHandler(async (event) => {
	const routerParams = await getValidatedRouterParams(event, validParams);
	const userId = z.coerce.bigint().min(1).parse(getRequestHeader(event, "x-user-id"));
	const body = await readValidatedBody(event, validInput.parse);

	console.log(`userId: ${userId}, gameId: ${routerParams.gameId}`);
	
	try {
		if (Object.keys(body).length === 0)
			throw Error("empty body");
		const [row] = await db
			.update(games)
			.set(body)
			.where(and(
				eq(games.id, routerParams.gameId),
				eq(games.creator_id, userId)))
			.returning();
		if (!row)
			throw Error("incorrect game- or userId");
		console.log(`game(${routerParams.gameId}) successfully updated: ${JSON.stringify(row)}`);
		return { success: true, game: row };
	} catch (error) {
		console.log(`Error at api/foyer/update/[id].patch: ${error.message}`);
		throw createError({
			statusCode: 500,
			statusMessage: "Game update failed"
		});
	}
});
