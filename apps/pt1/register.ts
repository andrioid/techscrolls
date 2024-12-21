import { AppBskyFeedGenerator } from "@atproto/api";
import {} from "@atproto/lexicon";
import { config } from "./config";
import { createAppContext } from "./context";

const run = async () => {
  const feedGenDid = config.feedGenDid;
  // only update this if in a test environment
  const ctx = await createAppContext();
  const agent = ctx.atpAgent;

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

  console.log("All done 🎉");
};

run();
