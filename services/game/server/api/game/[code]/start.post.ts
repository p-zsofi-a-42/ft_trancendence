import { defineHandler, getRequestHeader, getValidatedRouterParams } from "h3";
import { HTTPError } from "nitro";
import z from "zod";
import { eq, and, sql } from "drizzle-orm";
import { db, games, companies, rounds, roundResults } from "@utils/db";
import { client, connection, publish } from "@utils/redis";
import type { Game } from "@utils/db"

const validParams = z.object({
	code: z.string().min(6).max(12)
});

export default defineHandler(async (event) => {
	const routerParams = await getValidatedRouterParams(event, validParams);
	let game = undefined;

	try {
		const userId = z.coerce.bigint().min(1).parse(getRequestHeader(event, "user-id"));

		await db.transaction(async (tx) => {
			// 1. set game status to "ongoing"
			[game] = await tx.update(games)
				.set({ status: "ongoing" })
				.where(and(
					eq(games.idCode, routerParams.code),
					eq(games.creatorId, userId),
					eq(games.status, "created")
				)).returning();
			if (!game)
				throw new HTTPError({ statusMessage: "game not found", status: 404 });
			// 2. create the first round for the game
			const [round] = await tx.insert(rounds)
				.values({
					gameId: game.id,
					index: 0,
					endsAt: sql`now() + ${game.minutesPerRound} * interval '1 minute'`
				}).returning();
			// 3. create round_results entries for each company in the game
			const comps = await tx.select()
				.from(companies)
				.where(eq(companies.gameId, game.id));
			if (comps.length < 1)
				throw new HTTPError({ statusMessage: "game can't be started without any players (companies)", status: 400 });
			await tx.insert(roundResults).values(
				/* TODO: remove hard coded start parameters, store them some place more accessable instead */
				comps.map(c => ({
					gameId: game.id,
					roundId: round.id,
					companyId: c.id,
					capital: game.seedCapital,
					customers: 0,
					quality: 20,
					nDevelopers: 2,
					nSalespeople: 2,
					price: 1000,
					ownership: 100
				})),
			);
		});
	} catch (error: any) {
		console.log(`Error at /api/[code]/start.post: ${error.message} instance of ${error.constructor.name}`);
		if (error instanceof HTTPError)
			throw error;
		throw new HTTPError({ message: "failed to start game", status: 500 });
	}
	// notify all players that the game has started
	await publish(`game:session:${routerParams.code}`, { type: "started" })
	return (game);
});
