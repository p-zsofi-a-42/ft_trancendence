import type { RoundResult } from "@utils/db";
import { mean, max } from "mathjs";

// number of new customers every round
const POOL = 25;
// Sales capacity per salesperson per quarter
const SALES_CAPA = 8;
const BASE_CHURN = 0.1;
// Cost per employee and quarter	15,000
// Constant expenses per quarter	10,000
// Cost per customer and quarter	300
// Quality loss per quarter	2.00
// Quality improvement per developer and quarter	2.00
// Highest possible quality	100.00
// Developer efficiency loss per step	5.0%
// Customers per efficiency step	10
// Developers per efficiency step	2

export const GAME = {
	competitors: (results: RoundResult[], player: RoundResult): RoundResult[] => results.filter(r => r.companyId != player.companyId),
	avgQ: (competitors: RoundResult[]): number => mean(competitors.map((c: RoundResult) => c.quality)),
	avgP: (competitors: RoundResult[]): number => mean(competitors.map((c: RoundResult) => c.price)),
	// TODO: add weights
	attr: (avgQ: number, avgP: number, player: RoundResult) => ((player.quality / avgQ) * (avgP / player.price)),
	// TODO: add price shock
	// priceLevel: ( ) => max(.9, .9 * , ),
	churn: (attr: number): number => (max(BASE_CHURN * (1 / attr),)),
	pool: (competitorsChurn: number): number => (POOL + competitorsChurn),

	// TODO:
	// productivity: ,
	// newCustomers: (pool: number, attr: number, salesp: number) => ;

} as const;

export const decisionFields = [
	"nDevelopers",
	"nSalespeople",
	"price",
	"locked"
];
