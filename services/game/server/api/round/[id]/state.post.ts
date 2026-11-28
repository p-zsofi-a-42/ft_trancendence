import { defineHandler, getValidatedRouterParams } from "h3";
import { HTTPError } from "nitro";
import { and, eq, ne, sql } from "drizzle-orm";
import { db, rounds } from "@utils/db";
import { idParams, getGameById } from "@utils/game";
import { getUserId } from "@utils/user";
import { publish } from "@utils/redis";
import { stat } from "node:fs";

export default defineHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, idParams);
  const userId = getUserId(event);

  let [round] = await db
    .select()
    .from(rounds)
    .where(and(eq(rounds.id, id), ne(rounds.status, "done")));
  if (!round)
    throw new HTTPError({ status: 404, statusMessage: "round not found" });
  // check game ownership
  const game = await getGameById(round.gameId, userId);
  const [updatedRound] = await db
    .update(rounds)
    .set(
      round.status === "paused"
        ? {
            status: "ongoing",
            endsAt: sql`now() + ${game.minutesPerRound} * interval '1 minute'`,
          }
        : { status: "paused" },
    )
    .where(eq(rounds.id, id))
    .returning();

  if (!updatedRound)
    throw new HTTPError({ status: 404, statusMessage: "round not found" });

  const serverNow = new Date().toISOString();
  const state = { round: updatedRound, serverNow };

  await publish(`game:session:${game.idCode}`, {
    type: "round_state_changed",
    ...state,
  });

  return state;
});
