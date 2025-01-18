import { AppBskyFeedPost } from "@atproto/api";
import { eq, isNull } from "drizzle-orm";
import type { AtContext } from "../context";
import { extractTextFromPost } from "./extract-text-from-post";
import { getPublicPosts } from "./get-public-posts";
import { isForeignLanguage } from "./is-foreign-language";
import { postRecordFlags } from "./post-record-flags";
import { postRecords } from "./post/post-record.table";
import { postTexts } from "./post/post-texts.table";
import { postTable } from "./post/post.table";

export async function fetchMissingPostRecords(ctx: AtContext) {
  const missingPostUris = await ctx.db
    .select({
      uri: postTable.id,
    })
    .from(postTable)
    .leftJoin(postRecords, eq(postTable.id, postRecords.postId))
    .where(isNull(postRecords.postId));
  if (missingPostUris.length === 0) {
    return;
  }

  console.log(`[record-fetcher] Fetching ${missingPostUris.length} records`);

  const fetchedPosts = await getPublicPosts(missingPostUris.map((p) => p.uri));
  for (const post of fetchedPosts) {
    if (!AppBskyFeedPost.isRecord(post.record)) {
      console.warn(
        `[record-fetcher] record is not AppBskyFeedPost.Record: ${post.uri}`
      );
      return;
    }
    if (!AppBskyFeedPost.isRecord(post.record)) {
      console.warn("[record-fetcher] record does not match feed post");
      continue;
    }
    const record = post.record as AppBskyFeedPost.Record;

    // Text extraction of missing posts
    const extractedText = await extractTextFromPost(ctx, post.uri, post.record);
    if (isForeignLanguage(extractedText.join("\n"))) {
      return;
    }

    // This update should never be called on a post we dont have
    await ctx.db.transaction(async (tx) => {
      await tx
        .update(postTable)
        .set({
          flags: postRecordFlags(record),
          created: new Date(record.createdAt),
        })
        .where(eq(postTable.id, post.uri));

      await tx
        .insert(postRecords)
        .values({
          cid: post.cid,
          postId: post.uri,
          type: "AppBskyFeedPost.Record",
          value: record,
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
    });
  }
}
