import { defineHandler, getValidatedRouterParams } from "h3";
import { HTTPError } from "nitro";
import z from "zod";
import { eq, and, sql } from "drizzle-orm";
import { db, games, companies, rounds, roundResults } from "@utils/db";
import { publish } from "@utils/redis";
import type { Game } from "@utils/db";

const validParams = z.object({
  code: z.string().min(6).max(12),
});

export default defineHandler(async (event) => {
  const routerParams = await getValidatedRouterParams(event, validParams);
  let game: Game;

  try {
    const userId = z.coerce
      .number()
      .int()
      .positive()
      .parse(event.req.headers.get("user-id"));

    game = await db.transaction(async (tx) => {
      // 1. set game status to "ongoing"
      const [startedGame] = await tx
        .update(games)
        .set({ status: "ongoing" })
        .where(
          and(
            eq(games.idCode, routerParams.code),
            eq(games.creatorId, userId),
            eq(games.status, "created"),
          ),
        )
        .returning();
      if (!startedGame)
        throw new HTTPError({ statusMessage: "game not found", status: 404 });
      // 2. create the first round for the game
      const [round] = await tx
        .insert(rounds)
        .values({
          gameId: startedGame.id,
          index: 0,
          endsAt: sql`now() + ${startedGame.minutesPerRound} * interval '1 minute'`,
        })
        .returning();
      // 3. create round_results entries for each company in the game
      const comps = await tx
        .select()
        .from(companies)
        .where(eq(companies.gameId, startedGame.id));
      if (comps.length !== startedGame.nPlayers) {
        throw new HTTPError({
          statusMessage: `game requires exactly ${startedGame.nPlayers} players; currently has ${comps.length}`,
          status: 400,
        });
      }
      await tx.insert(roundResults).values(
        /* TODO: remove hard coded start parameters, store them some place more accessable instead */
        comps.map((c) => ({
          gameId: startedGame.id,
          roundId: round.id,
          companyId: c.id,
          capital: startedGame.seedCapital,
          customers: 0,
          quality: 20,
          nDevelopers: 2,
          nSalespeople: 2,
          price: 1000,
          ownership: 100,
        })),
      );
      return startedGame;
    });

    // TODO: define channel event types (joined, started, etc)
    // LEFT OFF HERE:
    // 1. test the game start flow
    // done 2. create an api endpoint to retrieve all users/players of a game
    // 3. game loop
    //
    // left overs from yesterday:
    // 2. check permissions (mostly frontend I think)
    // 3. implement the scheduler
    //  - think about recovery
    //  - implement round checking loop (fetch all ongoing games last rounds and check if their time is up, if so, start the next round)
  } catch (error: any) {
    console.log(
      `Error at /api/[code]/start.post: ${error.message} instance of ${error.constructor.name}`,
    );
    if (error instanceof HTTPError) throw error;
    throw new HTTPError({ message: "failed to start game", status: 500 });
  }
  // notify all players that the game has started
  await publish(`game:session:${routerParams.code}`, { type: "started" });
  return game;
});
