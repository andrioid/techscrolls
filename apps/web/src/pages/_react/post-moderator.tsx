import { AtUri } from "@atproto/api";
import { actions } from "astro:actions";
import { useTransition } from "react";

export function PostModerator({
  postId,
  text,
}: {
  postId: string;
  text: string;
}) {
  const [isPending, startTransition] = useTransition();

  const atUri = new AtUri(postId);
  const postUrl = `https://bsky.app/profile/${atUri.hostname}/post/${atUri.rkey}`;

  async function onClassifyHandler(isMatch: boolean) {
    return actions.classifyManually({
      match: isMatch,
      postUri: postId,
      tag: "tech",
    });
  }

  return (
    <div className="flex flex-row gap-3 p-4 bg-gray-50 border rounded-lg items-center">
      <div className="flex gap-4 flex-col">
        <div className="text-gray-500">
          <a href={postUrl} target="_blank">
            {postId}
          </a>
        </div>
        <div>{text}</div>
        <div>Tags</div>
      </div>
      <div className="flex flex-col gap-3">
        <button
          className="rounded-lg bg-green-600 text-white px-2 py-1 disabled:bg-gray-100"
          disabled={isPending}
          onClick={() => onClassifyHandler(true)}
        >
          Tech
        </button>
        <button
          className="rounded-lg bg-red-600 text-white px-2 py-1"
          onClick={() => onClassifyHandler(false)}
        >
          Not
        </button>
      </div>
    </div>
  );
}
