import {} from "@atproto/lexicon";
import { config } from "./config";
import { createAtContext } from "./context";
import { feeds } from "./feeds";

const run = async () => {
  const feedGenDid = config.feedGenDid;
  // only update this if in a test environment
  const ctx = await createAtContext();
  const agent = ctx.atpAgent;

  for (const feed of feeds) {
    await agent.api.com.atproto.repo.putRecord({
      repo: agent.session?.did ?? "",
      collection: "app.bsky.feed.generator",
      ...feed,
    });
  }
  /*
  await agent.api.com.atproto.repo.deleteRecord({
    repo: agent.session?.did ?? "",
    collection: "app.bsky.feed.generator",
    rkey: "testfeed",
  });
  */
  /*
  await agent.api.com.atproto.repo.putRecord({
    repo: agent.session?.did ?? "",
    collection: "app.bsky.feed.generator",
    rkey: "testfeed",
    record: {
      did: feedGenDid,
      displayName: "Scroll Test Feed",
      description: "Bare bones feed prototype",
      //avatar: avatarRef,
      createdAt: new Date().toISOString(),
    } satisfies AppBskyFeedGenerator.Record,
  });
  */

  console.log("All done 🎉");
};

run().then(() => process.exit(0));
