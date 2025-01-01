import { PostView } from "~react/bluesky/post-view";

export function BskyPostList({
  //posts,
  postUris,
  mayClassify,
}: {
  //posts: Array<AppBskyFeedDefs.PostView>;
  postUris: Array<string>;
  mayClassify?: boolean;
}) {
  return (
    <div className="w-full md:w-auto 5 md:max-w-xl flex flex-col gap-4">
      {postUris.map((p) => (
        <PostView key={p} uri={p} mayClassify={mayClassify} />
      ))}
    </div>
  );
}
