import { AppBskyEmbedImages } from "@atproto/api";

export function EmbedImage({ embed }: { embed: AppBskyEmbedImages.View }) {
  return (
    <div>
      {embed.images.map((image) => (
        <img
          key={image.thumb}
          loading="lazy"
          src={image.thumb}
          alt={image.alt}
          className="rounded-lg overflow-hidden object-cover h-auto max-h-[200px]"
        />
      ))}
    </div>
  );
}
