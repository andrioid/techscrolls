import { AppBskyFeedGetPostThread } from "@atproto/api";
import { useEffect, useState } from "react";
import { usePublicAgent } from "~react/bluesky/use-public-agent";

export function usePostThread(
  postUri: string,
  params?: {
    parentHeight?: number;
    depth?: number;
  }
) {
  const { parentHeight = 1, depth = 1 } = params ?? {};
  const agent = usePublicAgent();

  const [thread, setThread] =
    useState<AppBskyFeedGetPostThread.Response["data"]>();

  useEffect(() => {
    const ab = new AbortController();

    agent
      .getPostThread({
        uri: postUri,
        depth,
        parentHeight,
      })
      .then((res) => {
        setThread(res.data);
      });

    return () => {
      ab.abort();
    };
  }, [postUri]);

  return thread;
}
