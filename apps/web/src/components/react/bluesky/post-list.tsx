import type { AppBskyFeedDefs } from "@atproto/api";
import { PostView } from "~react/bluesky/post-view";

export function BskyPostList({
  posts,
  mayClassify,
}: {
  posts: Array<AppBskyFeedDefs.PostView>;
  mayClassify?: boolean;
}) {
  return (
    <div className="w-full md:w-auto 5 md:max-w-xl flex flex-col gap-4">
      {posts.map((post) => (
        <PostView key={post.uri} view={post} mayClassify={mayClassify} />
      ))}
    </div>
  );
}

function mockPromise(): Promise<boolean> {
  console.log("promise called");
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, 500);
  });
}
