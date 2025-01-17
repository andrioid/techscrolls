import { feeds, jwtFromRequest } from "@andrioid/atproto";
import { config } from "@andrioid/atproto/config";
import { AppBskyFeedDescribeFeedGenerator } from "@atproto/api";
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ request: req, locals }) => {
  const ctx = locals.at;
  const jwt = jwtFromRequest(req);

  return Response.json({
    // Possible to inject posts here later (ads, announcements, etc)
    did: config.feedGenDid,
    feeds: feeds
      .filter((f) => !f.private)
      .map((f) => ({
        uri: `at://${ctx.atpAgent.did}/app.bsky.feed.generator/${f.rkey}`,
      })),
  } satisfies AppBskyFeedDescribeFeedGenerator.Response["data"]);
};
