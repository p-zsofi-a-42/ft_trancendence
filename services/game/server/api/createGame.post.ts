import { defineHandler, readValidatedBody, readBody, createError } from "h3";
// import { z } from "zod";
import * as z from "zod";
// import { genCode } from "../utils/genGameCode";
// import { db, games } from "../utils/db";
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
const validGame = z.object({
	creator_id: z.number().int().min(0),
	n_players: z.number().int().min(3).max(5),
	n_rounds: z.number().int().min(1).max(40),
	seed_capital: z.number().int().min(100_000).max(10_000_000)
});

export default defineHandler(async (event) => {
	// TODO: valiation (readValidatedBody form h3 + zod schema)
	const body = await readBody(event);
	try {
		validGame.parse(body);
	} catch (error) {
		throw createError({
			statusCode: 500,
			statusMessage: "Invalid body"
		});
	}
	console.log(`game: ${JSON.stringify(body)}`);
	try {
		const newGame = await insertGame(body as Game); // provisional
		console.log(`created game(${newGame}): ${JSON.stringify(newGame)}`);
		return { success: true, game: newGame };
	} catch (error) {
		throw createError({
			statusCode: 500,
			statusMessage: 'Database error: ' + error.message
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
	"id" | "id_code" | "current_round" | "created_at">): Promise<Game> {
	for (let length = 6; length <= 12; length++) {
		for (let attempt = 0; attempt < 5; attempt++) {
			const [row] = await db.insert(games)
				.values({ ...newGame, id_code: genCode(length) })
				.onConflictDoNothing({ target: games.id_code })
				.returning();
			if (row) return row;
		}
	}
	throw createError({
		statusCode: 500,
		statusMessage: "Could not generate a game code"
	});
}
