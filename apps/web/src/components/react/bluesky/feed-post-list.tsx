import type { FeedHandlerOutput } from "@andrioid/atproto";
import { PostView } from "~react/bluesky/post-view";

export function BskyFeedPostList({
  posts,
  mayClassify,
}: {
  //posts: Array<AppBskyFeedDefs.PostView>;
  posts: Array<FeedHandlerOutput["feed"][number]>;
  mayClassify?: boolean;
}) {
  return (
    <div className="w-full md:w-auto 5 md:max-w-xl flex flex-col gap-4">
      {posts.map((p) => (
        <PostView
          key={p.post}
          uri={p.post}
          mayClassify={mayClassify}
          reason={p.reason}
        />
      ))}
    </div>
  );
}
