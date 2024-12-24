import { config } from "./config";
import { createAtContext } from "./context";
import { listenForPosts } from "./domain/jetstream-subscription";

console.log(`Server listening on ${config.port}`);
const atContext = await createAtContext();
//const sub = new PostSubscription(appContext);
//await sub.listen();
await listenForPosts(atContext);

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
      default:
        return new Response("404!");
    }
  },
});
