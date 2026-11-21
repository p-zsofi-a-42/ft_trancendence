import { definePlugin } from "nitro";
import { db, games, rounds, roundResults } from "@utils/db";
import { lte, sql, eq } from "drizzle-orm";
import { client, connection } from "@utils/redis";

// INFO: watch -n1 docker logs -n40 game_dev
export default definePlugin((nitroApp) => {
	console.log('Nitro plugin', nitroApp);
	// TODO: how should games be recovered after a crash? (e.g. if the server is restarted while a game is running)
	// TODO: at launch check for expired games and change their status to "done" (or reset their endsAt?)

	// console.time("testTimer");
	const timer = setInterval(async () => {
		// console.timeEnd("testTimer");
		// console.log("Testing the scheduler");

		// console.time("testTimer");
		try {
			// 1. get the lastest ongoing rounds
			const dueRounds = await db.query.rounds.findMany({
				where: { status: "ongoing", endsAt: { lte: sql`now()` } }
			});
			for (const r of dueRounds)
				await lockRound(r);

			// await db.transaction(async (tx) => {
			// 	const ongoingGames = await tx.query.games.findMany({
			// 		where: {
			// 			status: "ongoing",
			// 		},
			// 	});
			// 	const roundHist = await tx.query.rounds.findMany({
			// 		where: inArray(rounds.gameId, ongoingGames.map(g => g.id)),
			// 	});
			//
			// });
		} catch (error: any) {
			console.error(`scheduler error: ${error.message}`);
		}
	}, 1000);
	// Will run when nitro is being closed
	nitroApp.hooks.hook("close", () => { clearInterval(timer) });
});

async function lockRound(round: rounds): any {
	let game = undefined;
	try {
		//   1. get all round results and lock them
		//   2. set the round status to "done"
		//   3. create new round and round results
		await db.transaction(async (tx) => {
			await tx.update(rounds)
				.set({ status: "done" })
				.where(eq(rounds.id, round.id));
			await tx.update(roundResults)
				.set({ locked: true, lockedAt: sql`now()` })
				.where(and(
					eq(roundResults.roundId, round.id),
					eq(roundResults.locked, false)
			));
			[game] = await tx.update(games)
				.set({ status: "done" })
				.where(and(
					eq(games.id, round.gameId),
					eq(games.nRounds, round.index + 1)
			)).returning();
			if (!game) { // the game is not done yet
				
			}
		});
	} catch (error: any) {
		console.error(`Error in lockRound: ${error.message}`);
		return ;
	}
	if (!game) {
		[game] = await tx.select()
			.from(games)
			.where(eq(games.id, round.gameId));
	}
	// publish that this round is done
	await connection;
	await client.publish(`game:session:${game.idCode}`, JSON.stringify({ type: "round_finished", company: row }));
}
