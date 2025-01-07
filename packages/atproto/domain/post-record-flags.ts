import {
  AppBskyEmbedExternal,
  AppBskyEmbedImages,
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  type AppBskyFeedPost,
} from "@atproto/api";
import { PostFlags } from "./post/post-flags";

export function postRecordFlags(
  postRecord: AppBskyFeedPost.Record,
  currentFlags = 0
): number {
  let flags = currentFlags;
  flags |= PostFlags.Body; // Record here, so yay
  if (postRecord.reply) flags |= PostFlags.Replies;
  if (postRecord.embed) {
    const embed = postRecord.embed;
    if (AppBskyEmbedExternal.isMain(embed)) flags |= PostFlags.EmbedLink;
    if (AppBskyEmbedImages.isMain(embed)) flags |= PostFlags.EmbedImages;
    if (AppBskyEmbedRecord.isMain(embed)) flags |= PostFlags.EmbedRecord;
    if (AppBskyEmbedRecordWithMedia.isMain(embed))
      flags |= PostFlags.EmbedRecordWithMedia;
  }
  return flags;
}
