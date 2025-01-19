import type { FeedPostWithUri } from "@andrioid/jetstream";
import { AppBskyEmbedExternal, AtUri } from "@atproto/api";
import type { AtContext } from "../context";
import { addJob } from "../worker/add-job";
import { extractTextFromPost } from "./extract-text-from-post";
import { isForeignLanguage } from "./is-foreign-language";
import { postRecordFlags } from "./post-record-flags";
import { postExternals } from "./post/post-externals.table";
import { PostFlags } from "./post/post-flags";
import { postRecords } from "./post/post-record.table";
import { postTexts } from "./post/post-texts.table";
import { postTable } from "./post/post.table";

export async function storePost(ctx: AtContext, post: FeedPostWithUri) {
  const uri = new AtUri(post.uri);
  const authorId = uri.hostname;
  const text = post.record?.text;

  const extractedText = await extractTextFromPost(ctx, post.uri, post.record);
  // TODO: We need a common way for all this record parsing to take place
  // Something like updatePostWithRecord(transaction) so we can use it for initial and updates
  if (isForeignLanguage(extractedText.join("\n"))) {
    return;
  }

  let flags: number = 0;
  flags |= PostFlags.Body;
  if (post.record.reply) flags |= PostFlags.Replies;

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
        flags: postRecordFlags(post.record),
        replyParent: post.record.reply?.parent?.uri,
        replyRoot: post.record.reply?.root?.uri,
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
          postId: post.uri,
          source: et.type,
          text: et.text,
        })
        .onConflictDoNothing();
    }

    if (post.record.embed?.external) {
      const embed = post.record.embed;
      if (AppBskyEmbedExternal.isMain(embed)) {
        const url = embed.external.uri;
        if (!url.match(/(\w+\.(gif|png|jpeg|jpg))$/)) {
          await tx
            .insert(postExternals)
            .values({
              postId: post.uri,
              url: embed.external.uri,
            })
            .onConflictDoNothing();
          // schedule for scraping
          await addJob("scrape-external-url", {
            url: embed.external.uri,
          });
        }
      }
    }
  });
}
