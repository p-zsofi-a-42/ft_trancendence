import { defineEventHandler, createError } from "h3";
import type { Round } from "#shared/types/game";

export default defineEventHandler(async (event: any): Promise<Round> => {
	const roundId = getRouterParam(event, "id");
	const { user } = await requireUserSession(event);

	if (!roundId)
		throw createError({ message: "Round id is required", status: 400 });
	return (callGameService<Round>(`/api/round/${roundId}/state`, { method: "POST", userId: user.id }));
});
