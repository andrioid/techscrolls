import { AtUri } from "@atproto/api";
import { actions } from "astro:actions";
import { useState } from "react";

export function PostModerator({
  postId,
  text,
}: {
  postId: string;
  text: string;
}) {
  const [moderated, setModerated] = useState(false);

  const atUri = new AtUri(postId);
  const postUrl = `https://bsky.app/profile/${atUri.hostname}/post/${atUri.rkey}`;

  async function onClassifyHandler(isMatch: boolean) {
    await actions.classifyManually({
      match: isMatch,
      postUri: postId,
      tag: "tech",
    });
    setModerated(true);
  }

  return (
    <div className="flex flex-row gap-3 p-4 bg-gray-50 border rounded-lg items-center">
      {moderated ? (
        <div>
          <div className="text-gray-500">
            <a href={postUrl} target="_blank">
              {postId}
            </a>
          </div>
        </div>
      ) : (
        <>
          <div className="flex gap-4 flex-col">
            <div className="text-gray-500">
              <a href={postUrl} target="_blank">
                {postId}
              </a>
            </div>
            <div className="whitespace-pre-line">{text}</div>
            <div className="text-gray-500">Tags</div>
          </div>
          <div className="flex flex-col gap-3">
            <button
              className="rounded-lg bg-green-600 text-white px-2 py-1 disabled:bg-gray-100"
              onClick={() => onClassifyHandler(true)}
              disabled={moderated}
            >
              Tech
            </button>
            <button
              className="rounded-lg bg-red-600 text-white px-2 py-1"
              onClick={() => onClassifyHandler(false)}
              disabled={moderated}
            >
              Not
            </button>
          </div>
        </>
      )}
    </div>
  );
}
