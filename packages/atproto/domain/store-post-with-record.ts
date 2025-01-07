import type { FeedPostWithUri } from "@andrioid/jetstream";
import { AtUri } from "@atproto/api";
import type { AtContext } from "../context";
import { LISTEN_NOTIFY_POSTQUEUE } from "../scripts/classifier";
import { extractTextFromPost } from "./extract-text-from-post";
import { isForeignLanguage } from "./is-foreign-language";
import { postRecords } from "./post/post-record.table";
import { postTexts } from "./post/post-texts.table";
import { postTable } from "./post/post.table";

export async function storePost(ctx: AtContext, post: FeedPostWithUri) {
  const uri = new AtUri(post.uri);
  const authorId = uri.hostname;
  const text = post.record?.text;

  const extractedText = await extractTextFromPost(ctx, post);
  if (isForeignLanguage(extractedText.join("\n"))) {
    return;
  }
  await ctx.db.transaction(async (tx) => {
    if (!post.record) {
      throw new Error("Missing post record");
    }

    await tx
      .insert(postTable)
      .values({
        authorId,
        id: post.uri,
        created: new Date(post.record.createdAt),
        modified: new Date(post.record.createdAt),
        collection: "app.bsky.feed.post",
        flags: 0,
      })
      .onConflictDoNothing();
    await tx
      .insert(postRecords)
      .values({
        type: "AppBskyFeedPost.Record",
        postId: post.uri,
        value: post.record,
        cid: post.cid,
      })
      .onConflictDoNothing();
    for (const et of extractedText) {
      await tx
        .insert(postTexts)
        .values({
          post_id: post.uri,
          source: et.type,
          text: et.text,
        })
        .onConflictDoNothing();
    }
  });
  ctx.db.$client.notify(
    LISTEN_NOTIFY_POSTQUEUE,
    JSON.stringify({
      uri: post.uri,
      cid: post.cid,
      record: post.record,
    })
  );
  console.log(`[queue] ${post.uri} stored`);
}
