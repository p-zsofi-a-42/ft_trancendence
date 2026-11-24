import { defineEventHandler } from "h3";
import { Company, Player } from "#shared/types/game";
import { User } from "#shared/types/auth";

export default defineEventHandler(async (event: any): Promise<Player[]> => {
	const gameCode = getRouterParam(event, "code");

	if (!gameCode)
		throw createError({ message: "Game code is required", status: 400 });
	const companies = await callGameService<Company[]>(
		`/api/game/${gameCode}/companies`,
		{ method: "GET" }
	);
	const users = await callUserService<User[]>(
		"/users/players", {
		method: "POST",
		body: {
			userIds: companies.map(c => c.userId)
		}
	});
	const usersMap = new Map(
		users.map((u: User): [number, User] => [u.id, u])
	);
	return (companies.map((company: Company): Player => {
		const user = usersMap.get(company.userId);
		return ({
			...company,
			user: user,
		});
	}));
});
