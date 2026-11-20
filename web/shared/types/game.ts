export type Company = {
  id: number;
  userId: number;
  name: string;
  color: "red" | "blue" | "green" | "yellow" | "purple";
  createdAt: string;
};

export type Game = {
  id_code: string;
  n_players: number;
  n_rounds: number;
  current_round: number;
  seed_capital: number;
  creator_id: number;
  minutes_per_round: number;
  status: "created" | "ongoing" | "done";
  created_at: string;
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
