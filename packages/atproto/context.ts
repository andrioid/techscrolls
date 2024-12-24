import { AtpAgent, type AtpSessionData } from "@atproto/api";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { config } from "./config";
import { appData } from "./db/schema";

export async function createAtContext() {
  const dbClient = postgres(config.pgURL);
  const db = drizzle({
    client: dbClient,
  });

  await db.execute("select 1"); // Make sure we're connected to DB

  const atpAgent = new AtpAgent({
    service: "https://bsky.social", // TODO: look up actual pds
    persistSession: async (evt, sessionData) => {
      if (!sessionData) return;
      console.log("[atproto] storing session");
      await db
        .insert(appData)
        .values({
          k: "session",
          v: sessionData,
        })
        .onConflictDoUpdate({
          target: appData.k,
          set: {
            v: sessionData,
          },
        });
    },
  });
  try {
    const existingSession = await db
      .select({
        existingSession: appData.v,
      })
      .from(appData)
      .where(eq(appData.k, "session"));
    if (existingSession.length === 1) {
      const sdata = existingSession[0]
        .existingSession as unknown as AtpSessionData;
      console.log("[atproto] attempting to reuse session");
      const res = await atpAgent.resumeSession(sdata);

      //process.exit(1);
    } else {
      await atpAgent.login({
        identifier: config.identifier,
        password: config.password,
      });
    }

    const ctx = {
      atpAgent,
      db: drizzle(process.env["PG_URL"] ?? "fail"),
    };

    return ctx;
  } catch (err) {
    // Last ditch attempt
    console.log(
      "[atproto] encountered problem with normal login flow, last ditch"
    );
    await atpAgent.login({
      identifier: config.identifier,
      password: config.password,
    });
    return {
      atpAgent,
      db,
      dbClient,
    };
    /*
    throw new Error("Login to Bluesky has failed", {
      cause: err,
    });
    */
  }
}

export type AtContext = Awaited<ReturnType<typeof createAtContext>>;
