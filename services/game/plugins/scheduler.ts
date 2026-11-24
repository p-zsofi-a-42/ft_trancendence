import { definePlugin } from "nitro";
import { db, games, rounds, roundResults } from "@utils/db";
import type { Game, Company, Round, RoundResult } from "@utils/db";
import { lte, sql, and, eq } from "drizzle-orm";
import { client, connection } from "@utils/redis";

type resultValues = Omit<RoundResult, "id" | "roundId" | "locked" | "lockedAt">;

// INFO: watch -n1 docker logs -n40 game_dev
export default definePlugin(async (nitroApp) => {
	console.log('Nitro plugin', nitroApp);
	// TODO: how should games be recovered after a crash? (e.g. if the server is restarted while a game is running)
	// TODO: at launch check for expired games and change their status to "done" (or reset their endsAt?)

	// console.time("testTimer");
	const timer = setInterval(async (): Promise<void> => {
		// console.timeEnd("testTimer");
		// console.log("Testing the scheduler");
		//
		// console.time("testTimer");

		try {
			const dueRounds = await db.select().from(rounds)
				.where(and(
					eq(rounds.status, "ongoing"),
					lte(rounds.endsAt, sql`now()`)
				));
			for (const r of dueRounds)
				await closeRound(r);
		} catch (error: any) {
			console.error(`scheduler error: ${error.message}`);
		}
	}, 1000);
	// Will run when nitro is being closed
	nitroApp.hooks.hook("close", () => { clearInterval(timer) });
});

async function closeRound(round: Round): Promise<void> {
	console.log(`scheduler: close round ${JSON.stringify(round)}`);
	let game: Game = undefined;

	try {
		await db.transaction(async (tx: any): Promise<void> => {
			const results = await lockRound(tx, round);
			game = await getGame(tx, round);
			if (game.nRounds > round.index + 1)  // the game is not done yet
				await setUpNextRound(tx, round, game, results);
			else console.log(`scheduler: game ${game.idCode} has ended`);

		});
	} catch (error: any) {
		console.error(`scheduler error: ${error.message}`);
		return;
	}
	// TODO: inform the clients that the round has ended
	/*
	if (game && round) {
		await connection;
		await client.publish(`game:session:${game.idCode}`, JSON.stringify({ type: "round_finished", round: round.id }));
	}
	*/
}

/*
 * Set the round status to "done" and lock the round results for all players
 */
async function lockRound(tx: any, round: Round): Promise<RoundResult[]> {
	await tx.update(rounds)
		.set({ status: "done" })
		.where(eq(rounds.id, round.id));
	const results = await tx.update(roundResults)
		.set({ locked: true, lockedAt: sql`now()` })
		.where(and(
			eq(roundResults.roundId, round.id),
			eq(roundResults.locked, false)
		)).returning();
	return (results);
}

/*
 * If this is the last round of the game set status to "done"
 */
async function getGame(tx: any, round: Round): Promise<Game> {
	let [game] = await tx.update(games)
		.set({ status: "done" })
		.where(and(
			eq(games.id, round.gameId),
			eq(games.nRounds, round.index + 1)
		)).returning();
	if (!game) {
		[game] = await tx.select()
			.from(games)
			.where(eq(games.id, round.gameId));
	}
	return (game);
}

/*
 * Create a new round and a new round results entry for each player (initialized with the values of the last round)
 */
async function setUpNextRound(tx: any, round: Round, game: Game, results: RoundResult[]): Promise<void> {
	const [nextRound] = await tx.insert(rounds)
		.values({
			gameId: round.gameId,
			index: round.index + 1,
			endsAt: sql`now() + ${game.minutesPerRound} * interval '1 minute'`
		})
		.returning();
	const roundResultsCopy = results.map(({ id, roundId, locked, lockedAt, ...rest }: resultValues): resultValues => ({
		...rest,
		roundId: nextRound.id,
	}));
	await tx.insert(roundResults).values(roundResultsCopy);
}
