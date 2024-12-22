import { AtpAgent, type AtpSessionData } from "@atproto/api";
import { eq } from "drizzle-orm";
import { config } from "./config";
import { db } from "./db/db";
import { appData } from "./db/schema";

export async function createAtContext() {
  const atpAgent = new AtpAgent({
    service: "https://bsky.social", // TODO: look up actual pds
    persistSession: (evt, sessionData) => {
      if (!sessionData) return;
      db.insert(appData)
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
      db: db,
    };

    return ctx;
  } catch (err) {
    await atpAgent.login({
      identifier: config.identifier,
      password: config.password,
    });
    return {
      atpAgent,
      db,
    };
    /*
    throw new Error("Login to Bluesky has failed", {
      cause: err,
    });
    */
  }
}

export type AtContext = Awaited<ReturnType<typeof createAtContext>>;
