import { defineEventHandler, readBody, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
	console.log(`body: ${body}`);
	
	// validate
  return callGameService('/api/createGame', { method: 'POST', body: body})
})
