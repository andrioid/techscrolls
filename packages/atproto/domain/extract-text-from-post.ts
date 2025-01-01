import { AppBskyEmbedImages, AppBskyEmbedRecord } from "@atproto/api";
import { eq } from "drizzle-orm";
import type { AtContext } from "../context";
import { postRecords } from "./post/post-record.table";
import type { FeedPostWithUri } from "./queue-for-classification";

export type ExtractedTextType =
  | "body"
  | "image-alt"
  | "reply-root"
  | "reply-parent"
  | "image-alt"
  | "embed-record";

export type ExtractedText = {
  text: string;
  type: ExtractedTextType;
};

export async function extractTextFromPost(
  ctx: AtContext,
  post: FeedPostWithUri,
  recursive: boolean = true
): Promise<Array<ExtractedText>> {
  let out: Array<ExtractedText> = [];
  // 1. Grab the post text, if any
  if (post.record.text && typeof post.record.text === "string") {
    out.push({
      text: post.record.text,
      type: "body",
    });
  }
  // 2. Check if this is a reply
  if (post.record.reply) {
    // Grab record for parent
    const parent = await ctx.db
      .select()
      .from(postRecords)
      .where(eq(postRecords.postId, post.record.reply.parent.uri));
    if (parent[0]?.value?.text)
      out.push({
        text: parent[0].value.text,
        type: "reply-parent",
      });
    if (post.record.reply.root.uri !== post.record.reply.parent.ur) {
      const root = await ctx.db
        .select()
        .from(postRecords)
        .where(eq(postRecords.postId, post.record.reply.root.uri));
      if (root[0]?.value?.text)
        out.push({
          text: root[0].value.text,
          type: "reply-root",
        });
    }
  }

  // 3. Embed record
  if (AppBskyEmbedRecord.isMain(post.record.embed)) {
    if (recursive) {
      const [rec] = await ctx.db
        .select()
        .from(postRecords)
        .where(eq(postRecords.postId, post.record.embed.record.uri));
      if (rec?.value) {
        const extractedTexts = await extractTextFromPost(ctx, {
          cid: rec.cid,
          uri: rec.postId,
          record: rec.value,
        });
        const embt = embedText(extractedTexts);
        if (embt.length > 0) {
          out.push({
            text: embt,
            type: "embed-record",
          });
        }
      }
    }
  }

  if (AppBskyEmbedImages.isMain(post.record.embed)) {
    for (const image of post.record.embed.images) {
      if (!image.alt || image.alt.length < 10) continue;
      out.push({
        text: image.alt,
        type: "image-alt",
      });
    }
  }

  return out;
}

export function embedText(texts: Array<ExtractedText>): string {
  let embedText = ``;
  for (const et of texts) {
    if (!et || et.text.length === 0) continue;
    embedText += `### ${et.type}\n${et.text}`;
  }

  return embedText;
}
