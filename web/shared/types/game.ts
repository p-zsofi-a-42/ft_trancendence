// TODO: redundant, use Game instead
export type Foyer = {
	name: string;
	companyCount: number;
};

export type Company = {
	id: number;
	userId: number;
	name: string;
	color: "red" | "blue" | "green" | "yellow" | "purple";
	createdAt: string;
};

export type Game = {
	idCode: string;
	nPlayers: number;
	nRounds: number;
	currentRound: number;
	seedCapital: number;
	creatorId: number;
	minutesPerRound: number;
	status: "created" | "ongoing" | "done";
	createdAt: string;
};

export type Round = {
	id: number;
	index: number;
	endsAt: string;
	status: "ongoing" | "paused" | "done";
};

export type RoundResult = {
	id: number;
	roundId: number;
	companyId: number;
	capital: number;
	customers: number;
	quality: number;
	n_developers: number;
	n_salespeople: number;
	price: number;
	ownership: number;
	locked: boolean;
};
