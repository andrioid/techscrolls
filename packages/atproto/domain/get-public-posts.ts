import AtpAgent from "@atproto/api";

export const GET_POSTS_LIMIT = 25;

export type BskyPostView = ReturnType<AtpAgent["api"]["getPost"]>;

export async function getPublicPosts(wantedUris: Array<string>) {
  let remaining = [...wantedUris];
  const atpAgent = new AtpAgent({
    service: "https://public.api.bsky.app",
  });
  let posts: Awaited<
    ReturnType<typeof atpAgent.api.getPosts>
  >["data"]["posts"] = [];

  while (remaining.length > 0) {
    const limit =
      remaining.length < GET_POSTS_LIMIT ? remaining.length : GET_POSTS_LIMIT;
    const slice = remaining.splice(0, limit);
    const res = await atpAgent.api.getPosts({ uris: slice });
    if (res.success) {
      posts = [...posts, ...res.data.posts];
    }
  }
  return posts;
}
