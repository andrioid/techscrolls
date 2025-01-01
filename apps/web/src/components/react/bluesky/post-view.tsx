import { AppBskyFeedDefs, AppBskyFeedPost, AtUri } from "@atproto/api";
import { useState } from "react";
import { PostContent } from "react-bluesky-embed";
import { twMerge } from "tailwind-merge";
import { Embed } from "~react/bluesky/embed";
import { BlueskyLogo } from "~react/bluesky/logo";
import { PostSkeleton } from "~react/bluesky/post-skeleton";
import { usePostThread } from "~react/bluesky/use-postthread";
import { TagControls } from "~react/tag-controls";

export function PostView({
  //view,
  uri,
  mayClassify,
  isPrimary = true,
}: {
  uri: string;
  //view: AppBskyFeedDefs.PostView;
  mayClassify?: boolean;
  isPrimary?: boolean; // skips borders
}) {
  const [isClassified, setIsClassified] = useState<boolean | undefined>(
    undefined
  );

  const res = usePostThread(uri);
  if (res === undefined) {
    return <PostSkeleton />;
  }
  const thread = res?.thread;

  if (!AppBskyFeedDefs.isThreadViewPost(thread)) {
    return <p>not threadviewpost</p>;
  }
  const view = thread.post;
  thread.replies;

  const authorLink = `https://bsky.app/profile/${view.author.did}`;
  const atUri = new AtUri(uri);
  const postLink = `${authorLink}/post/${atUri.rkey}`;

  return (
    <div
      className={twMerge(
        isPrimary && "rounded-md border",
        isClassified === true && "border-green-800",
        isClassified === false && "border-red-800"
      )}
    >
      {AppBskyFeedDefs.isThreadViewPost(thread.parent) && (
        <div className="bg-slate-50">
          <PostView uri={thread.parent.post.uri} isPrimary={false} />
          <hr />
        </div>
      )}

      <div
        className={twMerge(
          "p-4 flex flex-col gap-4 transition-all",
          isClassified !== undefined && "hidden"
        )}
      >
        <div
          className={twMerge(
            "flex flex-row justify-between",
            !isPrimary && "text-sm"
          )}
        >
          <a href={authorLink} target="_blank">
            <div className="flex flex-row gap-4">
              <img
                src={view.author.avatar}
                className={twMerge(
                  "h-12 w-12 rounded-full",
                  !isPrimary && "h-6 w-6"
                )}
              />
              <div className={twMerge(!isPrimary && "flex flex-row gap-2")}>
                <h3 className="font-semibold">
                  {view.author.displayName ?? view.author.handle}
                </h3>
                <p className="text-gray-600">@{view.author.handle}</p>
              </div>
            </div>
          </a>
          <a href={postLink} target="_blank">
            <BlueskyLogo
              className={twMerge("h-8 w-8", !isPrimary && "h-4 w-4")}
            />
          </a>
        </div>

        <PostContent record={view.record as AppBskyFeedPost.Record} />
        {view.embed && <Embed embed={view.embed} />}
        <div className="flex flex-row justify-between items-center">
          <div className="text-sm text-gray-600">
            {new Date(view.indexedAt).toLocaleString()}
          </div>
          <a
            href={postLink}
            target="_blank"
            className="text-sm text-sky-600 font-semibold"
          >
            Read
          </a>
        </div>
      </div>
      {isClassified !== undefined && (
        <div className="p-4">
          <button
            className="py-1.5 px-3 border rounded-md"
            onClick={() => setIsClassified(undefined)}
          >
            Expand
          </button>
        </div>
      )}
      {mayClassify && (
        <div>
          <hr />
          <div className="py-1.5 px-4">
            <TagControls postUri={view.uri} />
          </div>
        </div>
      )}
    </div>
  );
}
