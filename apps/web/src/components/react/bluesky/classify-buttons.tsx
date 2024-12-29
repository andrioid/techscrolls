import { actions } from "astro:actions";
import { useState } from "react";
import { twMerge } from "tailwind-merge";

const classifyButtonClass =
  "min-h-5 min-w-5 bg-gray-700 rounded-md py-1.5 px-3 text-white disabled:bg-gray-400 disabled:text-gray-800";

export function ClassifyButtons({
  postUri,
  classification,
  onClassified,
}: {
  postUri: string;
  classification: boolean | undefined;
  onClassified: (isTech: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);

  async function onClassifyHandler(isMatch: boolean) {
    setLoading(true);
    await actions.classifyManually({
      match: isMatch,
      postUri: postUri,
      tag: "tech",
    });
    setLoading(false);
    onClassified(isMatch);
  }
  return (
    <div className="flex flex-row gap-2">
      <button
        disabled={loading || classification === true}
        className={twMerge(classifyButtonClass, "bg-green-800 text-white")}
        onClick={() => onClassifyHandler(true)}
      >
        Tech
      </button>
      <button
        disabled={loading || classification === false}
        className={twMerge(classifyButtonClass, "bg-red-800 text-white")}
        onClick={() => onClassifyHandler(false)}
      >
        Not Tech
      </button>
    </div>
  );
}
