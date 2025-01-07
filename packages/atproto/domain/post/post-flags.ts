/** Used to quickly identify what sort of content this post has */
export enum PostFlags {
  Body = 1 << 0,
  EmbedLink = 1 << 1,
  EmbedRecord = 1 << 2,
  EmbedImages = 1 << 3,
  Replies = 1 << 4,
  EmbedRecordWithMedia = 1 << 5,
}
