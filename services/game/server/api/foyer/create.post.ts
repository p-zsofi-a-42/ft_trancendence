import { defineHandler, getRequestHeader, readValidatedBody, createError } from "h3";
import z from "zod";
import { db, games } from "@utils/db";
import type { Game } from "@utils/db"
import { genCode } from "@utils/genGameCode";

// TODO:
// [] 1. orm
// [] 2. game id code generation
// [] 3. imports
// [] 4. improve/refactor genGameCode
// [] 5. curly brackets return values

// Q: es soll nicht auf die db Anfrage warten, aber wenn der await bis hier durch geht tut es das ja doch? oder wird pausiert?

// expects body = { creator_id, n_players, n_rounds, seed_capital }
const validInput = z.strictObject({
	nPlayers: z.number().int().min(3).max(5),
	nRounds: z.number().int().min(1).max(40),
	seedCapital: z.number().int().min(100_000).max(10_000_000)
});

export default defineHandler(async (event) => {
	const userId = z.coerce.bigint().min(1).parse(getRequestHeader(event, "user-id"));
	const body = await readValidatedBody(event, validInput.parse);

	try {
		const newGame = await insertGame({ ...body, creatorId: userId });
		console.log(`created game(${newGame.id}): ${JSON.stringify(newGame)}`);
		return { success: true, game: newGame };
	} catch (error) {
		console.log(`Error at /api/foyer/create.post: ${error.message}`);
		throw createError({
			statusCode: 500,
			statusMessage: "Game creation failed" + error.message
		});
	}
});

/*
 * Inserts the provided data and a unique id code into the games table
 *
 * Try to generate a short digit code (starting at length 6).
 * If it's not possible to create a unique code with the current length within 5 attampts, increase the length and repeat.
**/
async function insertGame(newGame: Omit<Game,
	"id" | "idCode" | "currentRound" | "createdAt">): Promise<Game> {
	for (let length = 6; length <= 12; length++) {
		for (let attempt = 0; attempt < 5; attempt++) {
			const [row] = await db.insert(games)
				.values({ ...newGame, idCode: genCode(length) })
				.onConflictDoNothing({ target: games.idCode })
				.returning();
			if (row) return row;
		}
	}
	throw Error("Could not generate a game code");
}
