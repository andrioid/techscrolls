import { AppBskyFeedPost, AppBskyRichtextFacet, RichText } from "@atproto/api";

export function PostContent({
  record,
}: {
  record: AppBskyFeedPost.Record | null;
}) {
  if (!record) return null;

  const rt = new RichText({
    text: record.text,
    facets: record.facets,
  });

  const richText = [];
  let counter = 0;
  for (const segment of rt.segments()) {
    if (
      segment.link &&
      AppBskyRichtextFacet.validateLink(segment.link).success
    ) {
      richText.push(
        <a
          key={counter}
          href={segment.link.uri}
          className="text-blue-600 hover:underline"
          target="_blank"
        >
          {segment.text}
        </a>
      );
    } else if (
      segment.mention &&
      AppBskyRichtextFacet.validateMention(segment.mention).success
    ) {
      richText.push(
        <a
          key={counter}
          href={`/profile/${segment.mention.did}`}
          className="text-blue-600 hover:underline"
        >
          {segment.text}
        </a>
      );
    } else if (
      segment.tag &&
      AppBskyRichtextFacet.validateTag(segment.tag).success
    ) {
      richText.push(
        <a
          key={counter}
          href={`/tag/${segment.tag.tag}`}
          className="text-blue-600 hover:underline"
        >
          {segment.text}
        </a>
      );
    } else {
      richText.push(segment.text);
    }

    counter++;
  }
  return (
    <p
      className={
        "min-[300px]:text-lg leading-6 break-word break-words whitespace-pre-wrap"
      }
    >
      {richText}
    </p>
  );
}
