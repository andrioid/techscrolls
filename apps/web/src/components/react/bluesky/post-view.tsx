import { AppBskyFeedDefs, AppBskyFeedPost, AtUri } from "@atproto/api";
import { useState } from "react";
import { PostContent } from "react-bluesky-embed";
import { twMerge } from "tailwind-merge";
import { ClassifyButtons } from "~react/bluesky/classify-buttons";
import { Embed } from "~react/bluesky/embed";
import { BlueskyLogo } from "~react/bluesky/logo";

export function PostView({
  view,
  mayClassify,
}: {
  view: AppBskyFeedDefs.PostView;
  mayClassify?: boolean;
}) {
  const [isClassified, setIsClassified] = useState<boolean | undefined>(
    undefined
  );

  function handleClassified(isTech: boolean) {
    setIsClassified(isTech);
  }

  if (!view) {
    console.log("no view", view);
    return null;
  }

  const authorLink = `https://bsky.app/profile/${view.author.did}`;
  const atUri = new AtUri(view.uri);
  const postLink = `${authorLink}/post/${atUri.rkey}`;

  return (
    <div
      className={twMerge(
        "rounded-md border",
        isClassified === true && "border-green-800",
        isClassified === false && "border-red-800"
      )}
    >
      <div
        className={twMerge(
          "p-4 flex flex-col gap-4 transition-all",
          isClassified !== undefined && "hidden"
        )}
      >
        <div className="flex flex-row justify-between">
          <a href={authorLink} target="_blank">
            <div className="flex flex-row gap-4">
              <img
                src={view.author.avatar}
                className="h-12 w-12 rounded-full"
              />
              <div>
                <h3 className="font-semibold">
                  {view.author.displayName ?? view.author.handle}
                </h3>
                <p className="text-gray-600">@{view.author.handle}</p>
              </div>
            </div>
          </a>
          <a href={postLink} target="_blank">
            <BlueskyLogo className="h-8 w-8" />
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
          <div className="flex flex-row p-4 text-sm">
            <ClassifyButtons
              postUri={view.uri}
              onClassified={handleClassified}
              classification={isClassified}
            />
          </div>
        </div>
      )}
    </div>
  );
}
