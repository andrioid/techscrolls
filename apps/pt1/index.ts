import { getFeedSkeletonHandler } from "./api/get-feed-skeleton";
import { wellKnownDidHandler } from "./api/well-known-did";
import { config } from "./config";
import { createAppContext } from "./context";
import { listenForPosts } from "./domain/jetstream-subscription";

console.log(`Server listening on ${config.port}`);
const appContext = await createAppContext();
//const sub = new PostSubscription(appContext);
//await sub.listen();
await listenForPosts(appContext);

Bun.serve({
  port: config.port,
  //idleTimeout: 120, // Remove when we have a DB
  async fetch(req) {
    const url = new URL(req.url);
    console.log(`[req] ${url.pathname} ${url.searchParams}`, req.headers);
    const res = new Response();
    switch (url.pathname) {
      case "/":
        return new Response("Bare bones feed generator for Bluesky");
      case "/.well-known/did.json":
        return wellKnownDidHandler(req, appContext);
      case "/xrpc/app.bsky.feed.getFeedSkeleton":
        return getFeedSkeletonHandler(req, appContext);
      default:
        return new Response("404!");
    }
  },
});
