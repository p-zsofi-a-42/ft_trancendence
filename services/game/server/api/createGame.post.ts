import { defineHandler, readValidatedBody, readBody, createError } from "h3";
// import { genCode } from "../utils/genGameCode";
// import { db, games } from "../utils/db";
import { db, games } from "@utils/db";
import { genCode } from "@utils/genGameCode";

// TODO:
// [] 1. orm
// [] 2. game id code generation
// [] 3. imports
// [] 4. improve/refactor genGameCode
// [] 5. curly brackets return values

// Q: es soll nicht auf die db Anfrage warten, aber wenn der await bis hier durch geht tut es das ja doch? oder wird pausiert?

export interface Game {
	id_code: string,
	n_rounds: number,
	n_players: number,
	seed_capital: number,
	creator_id: number
};

// expects body = { creator_id, n_players, n_rounds, seed_capital }
export default defineHandler(async (event) => {
	// TODO: valiation (readValidatedBody form h3 + zod schema)
	const body = await readBody(event);
	console.log(`game: ${JSON.stringify(body)}`);
	try {
		const newGame = await insertGame(body as Game); // provisional
		console.log(`created game: ${JSON.stringify(newGame)}`);
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
// TODO: add return type
async function insertGame(newGame: Omit<Game, "id_code">) {
	for (let length = 6; length < 12; length++) {
		for (let attempt = 0; attempt < 5; attempt++) {
			const row = db.insert(games)
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
