import { defineHandler, readBody, createError } from 'h3'
import { genGameCode } from '../../utils/genGameCode'
import { pool } from '../../db/rawSQL'

// expects body = { creator_id, n_players, n_rounds, seed_capital,  }
export default defineHandler(async (event) => {
	const body = await readBody(event);
	console.log(`game: ${JSON.stringify(body)}`);
	try {

		// CREATE TABLE IF NOT EXISTS games (
		// 	id						BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, -- TODO: ?
		// 	id_code				TEXT NOT NULL UNIQUE,
		// 	n_rounds			SMALLINT NOT NULL,
		// 	current_round	SMALLINT NOT NULL,
		// 	seed_capital	BIGINT NOT NULL,
		// 	creator_id		BIGINT NOT NULL, -- points to a user in the users db
		// 	created_at		TIMESTAMPTZ NOT NULL DEFAULT now()
		// );

		// TODO: es soll nicht auf die db Anfrage warten, aber wenn der await bis hier durch geht tut es das ja doch? oder wird pausiert?
		const gameIdCode = await genGameCode(6);
		console.log(`Generated game key: ${gameIdCode}`);
		
		const result = await pool.query(
			'INSERT INTO games (id_code, n_rounds, n_players, seed_capital, creator_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
			[gameIdCode, body.n_rounds, body.n_players, body.seed_capital, body.creator_id]
		)

		// result.rows enthält die eingefügten Datensätze (dank RETURNING *)
		const newGame = result.rows[0]
		return { success: true, game: newGame };
	} catch (error) {
		throw createError({
      statusCode: 500,
      statusMessage: 'Database error: ' + error.message 
    });
	}
});
