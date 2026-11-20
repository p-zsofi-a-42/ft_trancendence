import {
	defineHandler, getRequestHeader, readValidatedBody,
	getValidatedRouterParams
} from "h3";
import { HTTPError } from "nitro";
import z from "zod";
import { and, eq, not } from "drizzle-orm";
import { games, db } from "@utils/db";

const validParams = z.object({
	code: z.string().min(6).max(12)
});

const validInput = z.strictObject({
	nPlayers: z.number().int().min(1).max(5),
	nRounds: z.number().int().min(1).max(40),
	seedCapital: z.coerce.bigint().min(100_000).max(10_000_000),
	minutesPerRound: z.number().int().min(1).max(60),
	status: z.enum(["created", "ongoing", "done"])
}).partial();

// LEFT OFF HERE:
// 1. implement CRUD api endpoints for:
//  - starting the game
//  - update the game settings
//  - integrate /foyer into /game (in the service)
// 2. check permissions (mostly frontend I think)
// 3. implement the scheduler
//  - think about recovery
//  - implement round checking loop (fetch all ongoing games last rounds and check if their time is up, if so, start the next round)
// 4. setup round
//  - create new round entry and round_results entries for each company
/*
 * Update a game, identified by its game code, with the fields provided in the request body validated against the validInput schema.
 * The user making the request must be the creator of the game.
 */
export default defineHandler(async (event) => {
	const routerParams = await getValidatedRouterParams(event, validParams);
	const userId = z.coerce.bigint().min(1).parse(getRequestHeader(event, "user-id"));
	const body = await readValidatedBody(event, validInput.parse);
	let row = undefined;

	if (Object.keys(body).length === 0)
		throw new HTTPError({ message: "empty body", status: 400 });
	try {
		[row] = await db
			.update(games)
			.set(body)
			.where(and(
				eq(games.idCode, routerParams.code),
				eq(games.creatorId, userId),
				not(eq(games.status, "done")),
				body.status && body.status == "ongoing" ? not(eq(games.status, "ongoing")) : undefined
			)).returning();
	} catch (error: any) {
		console.log(`Error at /api/game/[code]/update.patch: ${error.message}`);
		throw new HTTPError({ message: "game update failed", status: 500 });
	}
	if (!row)
		throw new HTTPError({ message: "update not permitted", status: 400 });
	console.log(`game(${routerParams.code}) successfully updated: ${JSON.stringify(row)}`);
	return (row);
});
