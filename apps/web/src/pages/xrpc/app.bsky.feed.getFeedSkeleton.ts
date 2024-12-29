import { feeds, jwtFromRequest } from "@andrioid/atproto";
import { AtUri, type AppBskyFeedGetFeedSkeleton } from "@atproto/api";
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ request: req, locals }) => {
  const ctx = locals.at;
  const jwt = jwtFromRequest(req);
  //   if (!jwt)
  //     return new Response(
  //       "No authorization header found. This endpoint requires it."
  //     );

  const FeedParam = new URL(req.url).searchParams.get("feed");
  if (!FeedParam) {
    return HTTPError("no feed requested");
  }
  const feedUri = new AtUri(FeedParam);
  // pathname looks like this: /app.bsky.feed.generator/tech-following
  const rkeyMatch = feedUri.pathname.match(/\/([^/]+)$/);
  if (!rkeyMatch || rkeyMatch.length < 2) {
    return HTTPError("no rkey found in feed uri");
  }
  const rkey = rkeyMatch[1];

  const feed = feeds.find((f) => f.rkey === rkey);
  if (!feed) return HTTPError("feed not found");

  const actor = jwt?.iss ?? "did:plc:rrrwbar3wv576qpsymwey5p5"; // defaults to me for testing
  const posts = (await feed.handler({ ctx, actorDid: actor })).map((p) => ({
    post: p,
  }));

  return Response.json({
    // Possible to inject posts here later (ads, announcements, etc)
    feed: [...posts],
  } satisfies AppBskyFeedGetFeedSkeleton.Response["data"]);
};

function HTTPError(msg: string = "You are holding it wrong") {
  return new Response(msg, {
    status: 400,
    statusText: "Invalid arguments",
  });
}
