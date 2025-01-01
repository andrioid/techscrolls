import {
  AppBskyEmbedExternal,
  AppBskyEmbedImages,
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  AppBskyEmbedVideo,
  AppBskyFeedDefs,
} from "@atproto/api";
import { EmbedExternal } from "~react/bluesky/embed-external";
import { EmbedImage } from "~react/bluesky/embed-image";
import { PostView } from "~react/bluesky/post-view";

export function Embed({ embed }: { embed: AppBskyFeedDefs.PostView["embed"] }) {
  if (AppBskyEmbedImages.isView(embed)) {
    return <EmbedImage embed={embed} />;
  }
  if (AppBskyEmbedExternal.isView(embed)) {
    return <EmbedExternal embed={embed} />;
  }

  if (AppBskyEmbedRecord.isView(embed)) {
    return <PostView uri={embed.record.uri as string} />;
  }

  if (AppBskyEmbedRecordWithMedia.isView(embed)) {
    return (
      <>
        <Embed embed={embed.media} />
        <Embed embed={embed.record} />
      </>
    );
  }

  if (AppBskyEmbedRecord.isViewRecord(embed?.record)) {
    return <PostView uri={embed.record.uri as string} />;
  }

  if (AppBskyEmbedVideo.isView(embed)) {
    return <p>video</p>;
  }

  const type = embed?.$type;
  console.log("unhandled embed", type, embed);

  //return <PostView uri={embed.record.uri as string} />;
  return <p className="text-red-700 text-sm font-mono">[TODO] {type}</p>;
}
