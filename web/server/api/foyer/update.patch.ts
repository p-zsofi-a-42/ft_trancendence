import { defineEventHandler, readBody, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { user } = await requireUserSession(event);
	console.log(`body: ${body}`);
	
	// validate
  return callGameService('/api/game/update', { method: 'POST', body: body, userId: user.id});
});
