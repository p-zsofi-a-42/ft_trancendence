import { createError } from "h3";
import { signWsTicket } from "~~/server/utils/wsTicket";

// Returns a WebSocket ticket (JWT) for the current user to access the Game Session.
export default defineEventHandler(async (event) => {
	const { user } = await requireUserSession(event);
	const gameCode = getRouterParam(event, "code");

	if (!gameCode)
		throw createError({ message: "Game code is required", status: 400 });
	return { ticket: await signWsTicket(user.id, "game", gameCode) };
})
