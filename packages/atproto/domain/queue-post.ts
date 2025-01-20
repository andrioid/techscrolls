import {
  toFeedPostWithUri,
  type CommitEvent,
  type CommitPost,
} from "@andrioid/jetstream";
import type { AtContext } from "../context";
import { storePost } from "./store-post-with-record";

// TODO: This should probably receive the full jetstream event
/**
 *
 * @deprecated Just use storePost
 */
export async function queuePost(
  ctx: AtContext,
  postmsg: CommitEvent<CommitPost>
) {
  const post = toFeedPostWithUri({
    cid: postmsg.commit.cid,
    did: postmsg.did,
    rkey: postmsg.commit.rkey,
    record: postmsg.commit.record,
  });
  await storePost(ctx.db, post);
}
