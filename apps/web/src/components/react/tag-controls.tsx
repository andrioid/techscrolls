import { Icon } from "@iconify/react";
import { actions } from "astro:actions";
import { produce } from "immer";
import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import { PillBadge } from "~react/pill-badge";

const buttonClass =
  "rounded-md border p-1 hover:bg-gray-50 hover:text-sky-800 hover:border-sky-800";

type TagType = Exclude<
  Awaited<ReturnType<typeof actions.getTagsForPost>>["data"],
  undefined
>[number] & {
  avgScore?: number;
};

export function TagControls({ postUri }: { postUri: string }) {
  const [tags, setTags] = useState<Array<TagType>>([]);

  useEffect(() => {
    actions.getTagsForPost({ postUri }).then((tags) => {
      if (tags.error) return [];
      setTags(
        tags.data.map((tag) => {
          return {
            ...tag,
            avgScore: Math.floor(
              tag.scores.length > 0
                ? tag.scores.reduce((acc, curr) => {
                    return acc + curr.score;
                  }, 0) / tag.scores.length
                : 0
            ),
          };
        })
      );
    });
  }, []);

  async function handleClassified(
    tagId: string,
    classification: boolean | null
  ) {
    try {
      await actions.classifyManually({
        postUri,
        match: classification,
        tag: tagId,
      });
      setTags(
        produce((draft) => {
          const tagIdx = draft.findIndex((d) => d.tag === tagId);
          const newScore = classification === true ? 100 : 0;
          if (tagIdx === -1) return draft;
          const manualIndex = draft[tagIdx].scores.findIndex(
            (d) => d.algo === "manual"
          );
          if (manualIndex !== -1) {
            draft[tagIdx].scores[manualIndex].score =
              classification === true ? 100 : 0;
          } else {
            draft[tagIdx].scores.push({
              algo: "manual",
              score: newScore,
            });
          }
        })
      );
    } catch (err) {
      // ignore
    }
    // TODO: Show that it's tagged now
  }

  return (
    <div className="font-semibold uppercase flex flex-col gap-2">
      {tags &&
        tags
          .filter((tag) => tag.avgScore !== undefined)
          .map((tag) => (
            <div
              className="flex flex-row gap-2 items-center text-base"
              key={tag.tag}
            >
              <div className="flex flex-col gap-1">
                <span>
                  {`#${tag.tag}`}{" "}
                  <span
                    className={twMerge(
                      tag.avgScore! >= 80 && "text-green-700",
                      tag.avgScore! < 80 && "text-orange-700",
                      tag.avgScore! <= 50 && "text-red-700"
                    )}
                  >
                    {tag.avgScore}%
                  </span>
                </span>

                <span className="inline-flex items-center gap-1">
                  <button
                    className={twMerge(buttonClass)}
                    onClick={() => handleClassified(tag.tag, true)}
                  >
                    <Icon icon="tabler:tag" className="h-5 w-5" />
                  </button>
                  <button
                    className={twMerge(buttonClass)}
                    onClick={() => handleClassified(tag.tag, false)}
                  >
                    <Icon icon="tabler:tag-off" className="h-5 w-5" />
                  </button>
                </span>
              </div>
              <span>
                {tag.scores.map((cl) => (
                  <PillBadge label={cl.algo} key={cl.algo}>
                    {cl.score} %
                  </PillBadge>
                ))}
              </span>
            </div>
          ))}
    </div>
  );
}
