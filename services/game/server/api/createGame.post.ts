import { defineHandler, readValidatedBody, readBody, createError } from "h3";
import { insertGame } from "../utils/genGameCode";
import { games } from "../utils/db";

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
		console.log(`Generated game key: ${gameIdCode}`);
		console.log(`insert: ${JSON.stringify({
			id_code: gameIdCode,
			n_rounds: body.n_rounds,
			n_players: body.n_players,
			seed_capital: body.seed_capital,
			creator_id: body.creator_id
		})}`);
		
		// const newGame = await db.insert(games).values({
		// 	id_code: gameIdCode,
		// 	n_rounds: body.n_rounds,
		// 	n_players: body.n_players,
		// 	seed_capital: body.seed_capital,
		// 	creator_id: body.creator_id
		// }).returning();
		console.log(`created game: ${JSON.stringify(newGame)}`);
		return { success: true, game: newGame };
	} catch (error) {
		throw createError({
      statusCode: 500,
      statusMessage: 'Database error: ' + error.message
    });
	}
});
