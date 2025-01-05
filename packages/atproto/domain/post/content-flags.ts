/** Used to quickly identify what sort of content this post has */
export enum ContentFlags {
  Body = 1 << 0,
  ExternalLink = 1 << 1,
  EmbedRecord = 1 << 2,
  EmbedMedia = 1 << 3,
}
