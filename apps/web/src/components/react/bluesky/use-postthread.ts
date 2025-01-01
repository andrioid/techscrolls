import { AppBskyFeedGetPostThread } from "@atproto/api";
import { useEffect, useState } from "react";
import { usePublicAgent } from "~react/bluesky/use-public-agent";

export function usePostThread(postUri: string) {
  const agent = usePublicAgent();

  const [thread, setThread] =
    useState<AppBskyFeedGetPostThread.Response["data"]>();

  useEffect(() => {
    const ab = new AbortController();

    agent
      .getPostThread({
        uri: postUri,
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
