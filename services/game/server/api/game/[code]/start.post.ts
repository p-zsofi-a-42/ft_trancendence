import { defineHandler, getRequestHeader, readValidatedBody } from "h3";
import { HTTPError } from "nitro";
import z from "zod";
import { eq, and, sql } from "drizzle-orm";
import { db, games, companies, rounds, round_results } from "@utils/db";
import type { Game } from "@utils/db"

const validParams = z.object({
	code: z.string().min(6).max(12)
});

export default defineHandler(async (event) => {
	const routerParams = await getValidatedRouterParams(event, validParams);

	try {
		const userId = z.coerce.bigint().min(1).parse(getRequestHeader(event, "user-id"));
		
		await db.transaction(async (tx) => {
			// 1. set game status to "ongoing"
			const [game] = await tx.update(games)
				.set({ status: "ongoing" })
				.where(and(
					eq(games.id, routerParams.code),
					eq(games.creatorId, userId),
					eq(games.status, "waiting")
				)).returning();
			if (!game) {
				console.log(`Error at /api/start/create.post: ${error.message}`);
				throw new HTTPError({ statusMessage: "game not found", status: 404 });
			}
			// 2. create the first round for the game
			const [round] = await tx.insert(rounds)
				.values({
					gameId: game.id,
					index: 0,
					endsAt: sql`now() + ${game.minuesPerRound} * interval '1 minute'`
				})
				.returning();
			// 3. create round_results entries for each company in the game
			const comps = await tx.select()
				.from(companies)
				.where(eq(companies.gameId, game.id))
				.returning();
			if (comps.length < 1)
				throw new HTTPError({ statusMessage: "game can't be started without any players (companies)", status: 400 });
			await tx.insert(roundResults).values(
				comps.map(c => ({
					game_id: game.id,
					round_id: round.id,
					company_id: c.id,
					capital: game.seed_capital,
					/* TODO: remove hard coded start parameters, store them some place more accessable instead */
					customers: 0,
					quility: 20,
					nDevelopers: 2,
					nSalespeople: 2,
					price: 1000,
					ownership: 100
				})),
			);
		});
		// notify all players that the game has started
		await connection;
		await client.publish(`game:session:${code}`, JSON.stringify({ type: "started" }));
		// TODO: define channel event types (joined, started, etc)
		// LEFT OFF HERE:
		// 1. test the game start flow
		// 2. create an api endpoint to retrieve all users/players of a game
		// 3. game loop
		//
		// left overs from yesterday:
		// 2. check permissions (mostly frontend I think)
		// 3. implement the scheduler
		//  - think about recovery
		//  - implement round checking loop (fetch all ongoing games last rounds and check if their time is up, if so, start the next round)
	} catch (error: any) {
		console.log(`Error at /api/start/create.post: ${error.message} instance of ${error.constructor.name}`);
		if (error instanceof HTTPError)
			throw error;
		throw new HTTPError({message: "failed to start game", status: 500 });
	}
});
