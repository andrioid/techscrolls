import { AppBskyEmbedExternal } from "@atproto/api";

export function EmbedExternal({ embed }: { embed: AppBskyEmbedExternal.View }) {
  return (
    <a href={embed.external.uri} target="_blank">
      {embed.external.thumb && (
        <img
          loading="lazy"
          src={embed.external.thumb}
          className="aspect-square object-cover max-h-48 rounded-lg border"
        />
      )}
      <div className="text-gray-600 text-sm">{embed.external.uri}</div>
    </a>
  );
}
