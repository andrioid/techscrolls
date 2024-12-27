import { feeds, getOrUpdateFollows, jwtFromRequest } from "@andrioid/atproto";
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
    return HTTPError();
  }
  const feedUri = new AtUri(FeedParam);
  // pathname looks like this: /app.bsky.feed.generator/tech-following
  const rkeyMatch = feedUri.pathname.match(/\/([^/]+)$/);
  if (!rkeyMatch || rkeyMatch.length < 2) {
    return HTTPError();
  }
  const rkey = rkeyMatch[1];

  const feed = feeds.find((f) => f.rkey === rkey);
  if (!feed) return HTTPError();

  const actor = jwt?.iss ?? "did:plc:rrrwbar3wv576qpsymwey5p5"; // defaults to me for testing
  await getOrUpdateFollows(ctx, actor);
  const posts = (await feed.handler(ctx, actor)).map((p) => ({
    post: p,
  }));

  return Response.json({
    feed: [
      // {
      //   // Intro post. Only show that once in a while or when empty
      //   post: "at://did:plc:2uszitvsky5qnygpolsfr5ey/app.bsky.feed.post/3ldqhkub36s2d",
      // },
      ...posts,
    ],
  } satisfies AppBskyFeedGetFeedSkeleton.Response["data"]);
};

function HTTPError() {
  return new Response("You are holding it wrong", {
    status: 400,
    statusText: "Invalid arguments",
  });
}
