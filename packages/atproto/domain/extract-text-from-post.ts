import {
  AppBskyEmbedExternal,
  AppBskyEmbedImages,
  AppBskyEmbedRecord,
  AppBskyEmbedVideo,
  AppBskyFeedPost,
} from "@atproto/api";
import { eq } from "drizzle-orm";
import type { AtContext } from "../context";
import { postRecords } from "./post/post-record.table";

export type ExtractedTextType =
  | "body"
  | "image-alt"
  | "reply-root"
  | "reply-parent"
  | "image-alt"
  | "video-alt"
  | "embed-record"
  | "embed-external"
  | "embed-external-body";

export type ExtractedText = {
  text: string;
  type: ExtractedTextType;
};

export async function extractTextFromPost(
  ctx: AtContext,
  postUri: string,
  record: AppBskyFeedPost.Record,
  recursive: boolean = true
): Promise<Array<ExtractedText>> {
  let out: Array<ExtractedText> = [];
  // 1. Grab the post text, if any
  if (record.text && typeof record.text === "string") {
    out.push({
      text: record.text,
      type: "body",
    });
  }
  // 2. Check if this is a reply
  if (record.reply) {
    // Grab record for parent
    const parent = await ctx.db
      .select()
      .from(postRecords)
      .where(eq(postRecords.postId, record.reply.parent.uri));
    if (parent[0]?.value?.text)
      out.push({
        text: parent[0].value.text,
        type: "reply-parent",
      });
    if (record.reply.root.uri !== record.reply.parent.uri) {
      const root = await ctx.db
        .select()
        .from(postRecords)
        .where(eq(postRecords.postId, record.reply.root.uri));
      if (root[0]?.value?.text)
        out.push({
          text: root[0].value.text,
          type: "reply-root",
        });
    }
  }

  // 3. Embed record
  if (AppBskyEmbedRecord.isMain(record.embed)) {
    if (recursive) {
      const [rec] = await ctx.db
        .select()
        .from(postRecords)
        .where(eq(postRecords.postId, record.embed.record.uri));
      if (rec?.value) {
        const extractedTexts = await extractTextFromPost(
          ctx,
          rec.postId,
          rec.value
        );
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

  // 4. Images alt text
  // - Future: Use an image classifier
  if (AppBskyEmbedImages.isMain(record.embed)) {
    for (const image of record.embed.images) {
      if (!image.alt || image.alt.length < 10) continue;
      out.push({
        text: image.alt,
        type: "image-alt",
      });
    }
  }

  // 5. Links
  if (AppBskyEmbedExternal.isMain(record.embed)) {
    let text = record.embed.external.title;
    if (record.embed.external.description) {
      text += `\n${record.embed.external.description}`;
    }
    out.push({
      type: "embed-external",
      text,
    });
  }

  // 6. Video links
  if (AppBskyEmbedVideo.isMain(record.embed) && record.embed.alt) {
    out.push({
      type: "video-alt",
      text: record.embed.alt,
    });
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
