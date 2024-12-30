import { Icon } from "@iconify/react";
import { actions } from "astro:actions";
import { produce } from "immer";
import { Fragment, useEffect, useMemo, useState } from "react";
import { twMerge } from "tailwind-merge";
import { PillBadge } from "~react/pill-badge";

const buttonClass =
  "rounded-md border p-1 hover:bg-gray-50 hover:text-sky-800 hover:border-sky-800";

export function TagControls({ postUri }: { postUri: string }) {
  const [tags, setTags] = useState<
    Exclude<
      Awaited<ReturnType<typeof actions.getTagsForPost>>["data"],
      undefined
    >
  >([]);

  useEffect(() => {
    actions.getTagsForPost({ postUri }).then((tags) => {
      if (tags.error) return [];
      setTags(tags.data);
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

  const avgScore = useMemo(() => {
    const totalScores = tags.reduce((acc, tag) => {
      const sum = tag.scores.reduce((sum, score) => sum + score.score, 0);
      if (sum === 0) return acc;
      return acc + sum / tag.scores.length;
    }, 0);

    return totalScores / tags.length;
  }, [tags]);

  return (
    <span className="inline-flex font-semibold uppercase items-center gap-2">
      {tags &&
        tags.map((tag) => (
          <Fragment key={tag.tag}>
            <span className="text-base">{`#${tag.tag} ${avgScore}%`}</span>

            <span className="inline-flex gap-1">
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
            {tag.scores.map((cl) => (
              <PillBadge label={cl.algo} key={cl.algo}>
                {cl.score} %
              </PillBadge>
            ))}
          </Fragment>
        ))}
    </span>
  );
}
