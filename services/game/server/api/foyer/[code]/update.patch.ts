import { defineHandler, createError, getRequestHeader, readValidatedBody,
	getValidatedRouterParams } from "h3";
import z from "zod";
import { and, eq } from "drizzle-orm";
import { games, db } from "@utils/db";

const validParams = z.object({
	code: z.string().min(6).max(12)
});

const validInput = z.strictObject({
	nPlayers: z.number().int().min(1).max(5),
	nRounds: z.number().int().min(1).max(40),
	seedCapital: z.bigint().min(100_000).max(10_000_000)
}).partial();

/*
 * Update a game, identified by its game code, with the fields provided in the request body validated against the validInput schema.
 * The user making the request must be the creator of the game.
 */
export default defineHandler(async (event) => {
	const routerParams = await getValidatedRouterParams(event, validParams);
	const userId = z.coerce.bigint().min(1).parse(getRequestHeader(event, "user-id"));
	const body = await readValidatedBody(event, validInput.parse);

	if (Object.keys(body).length === 0)
		throw Error("empty body");
	const [row] = await db
		.update(games)
		.set(body)
		.where(and(
			eq(games.idCode, routerParams.code),
			eq(games.creatorId, userId)))
		.returning();
	if (!row)
		throw Error("user id or game code is incorrect");
	console.log(`game(${routerParams.code}) successfully updated: ${JSON.stringify(row)}`);
	return (row);
});
