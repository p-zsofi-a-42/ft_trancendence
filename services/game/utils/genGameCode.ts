import crypto from 'node:crypto'
import { pool } from '../db/rawSQL'

const CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function genCode(length: number): string {
	let		result = "";
	const	randoms = crypto.randomBytes(length);

	for (let i = 0; i < length; i++)
		result += CHARACTERS[randoms[i] % CHARACTERS.length];
	return result;
}
// 1. gen with length of the last record in games
// 2. if isUnique use
// 3. else increase length generate & check again
export async function genGameCode(length: number): Promise<string> {
	let	code = "";
	let	attempt = 0;
	const	maxAttempts = 5;

	while (attempt++ < maxAttempts) {
		code = genCode(length);
		const { rows } = await pool.query('SELECT id_code FROM games WHERE id_code = $1', [code])
		if (rows.length === 0)
			return code;
	}
	return genGameCode(++length);
}
