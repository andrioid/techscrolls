import {
  getOrUpdateFollows,
  getTechFollowingFeed,
  jwtFromRequest,
} from "@andrioid/atproto";
import type { AppBskyFeedGetFeedSkeleton } from "@atproto/api";
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ request: req, locals }) => {
  const ctx = locals.at;
  const jwt = jwtFromRequest(req);
  //   if (!jwt)
  //     return new Response(
  //       "No authorization header found. This endpoint requires it."
  //     );

  // This should only be done once in a while, not every time
  const actor = jwt?.iss ?? "did:plc:rrrwbar3wv576qpsymwey5p5";
  await getOrUpdateFollows(ctx, actor);
  const posts = (await getTechFollowingFeed(ctx, actor)).map((p) => ({
    post: p,
  }));

  return Response.json({
    feed: [
      {
        // Intro post. Only show that once in a while or when empty
        post: "at://did:plc:2uszitvsky5qnygpolsfr5ey/app.bsky.feed.post/3ldqhkub36s2d",
      },
      ...posts,
    ],
  } satisfies AppBskyFeedGetFeedSkeleton.Response["data"]);
};
