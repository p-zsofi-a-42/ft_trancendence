import { defineEventHandler } from "h3";
import { Company } from "#shared/types/game";
import { User } from "#shared/types/auth";

export default defineEventHandler(async (event: any): Promise<Company[]> => {
	const gameCode = getRouterParam(event, "code");

	if (!gameCode)
		throw createError({ message: "Game code is required", status: 400 });
	const companies = await callGameService<Company[]>(`/api/game/${gameCode}/companies`, { method: "GET" });
	return (callUserService<User[]>("/users/players", { method: "POST", body: { userIds: companies.map(c => c.userId)} }));
});
