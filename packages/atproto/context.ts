import { AtpAgent, type AtpSessionData } from "@atproto/api";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { config } from "./config";
import { appData } from "./db/schema";

export async function createAtContext() {
  const dbClient = postgres(config.pgURL, {
    idle_timeout: 20,
    max_lifetime: 60 * 30,
  });
  const db = drizzle({
    client: dbClient,
    logger: false,
    // TODO: Add schema, but requires that we have that all imported
  });

  await db.execute("select 1"); // Make sure we're connected to DB

  const atpAgent = new AtpAgent({
    service: "https://bsky.social", // TODO: look up actual pds
    persistSession: async (evt, sessionData) => {
      if (!sessionData) return;
      // Storing session
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
  const atpAgentPublic = new AtpAgent({
    service: "https://public.api.bsky.app",
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
    } else {
      console.log(
        "[atproto] creating a new session",
        config.identifier,
        config.password
      );
      await atpAgent.login({
        identifier: config.identifier,
        password: config.password,
      });
    }

    const ctx = {
      atpAgent,
      atpAgentPublic,
      db,
      dbClient,
    };

    return ctx;
  } catch (err) {
    if (err instanceof Error) {
      console.error(err.message, err.cause);
    }
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
      atpAgentPublic,
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
