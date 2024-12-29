import {
  AppBskyEmbedExternal,
  AppBskyEmbedImages,
  AppBskyFeedDefs,
} from "@atproto/api";
import { EmbedExternal } from "~react/bluesky/embed-external";
import { EmbedImage } from "~react/bluesky/embed-image";

export function Embed({ embed }: { embed: AppBskyFeedDefs.PostView["embed"] }) {
  if (AppBskyEmbedImages.isView(embed)) {
    return <EmbedImage embed={embed} />;
  }
  if (AppBskyEmbedExternal.isView(embed)) {
    return <EmbedExternal embed={embed} />;
  }
  /*
  if (AppBskyEmbedRecord.isView(embed)) {
    return <p>record</p>;
  }

  if (AppBskyEmbedVideo.isView(embed)) {
    return <p>video</p>;
  }
  */
  const type = embed?.$type as string;

  return <p className="text-red-700 text-sm font-mono">[TODO] {type}</p>;
}
