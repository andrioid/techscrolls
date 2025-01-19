import { and, sql } from "drizzle-orm";
import type { AtContext } from "../../context";
import type { ExtractedTextType } from "../extract-text-from-post";
import { postTexts } from "./post-texts.table";

// Use cases
// - For training (only manual tags)
// - For classifying (specific post id)
// - Include external texts if any
export async function getPostTexts(ctx: AtContext) {
  // 1. Find all the relevant post texts
  const res = await ctx.db
    .select({
      postId: postTexts.postId,
      texts: sql<
        Array<{
          text: string;
          type: ExtractedTextType;
        }>
      >`json_agg(
            json_build_object(
                'text', ${postTexts.text},
                'type', ${postTexts.source}
            )
          )`,
    })
    .from(postTexts)
    // TODO: Should be leftJoin. But testing
    .where(and()) // TODO: Finish this
    .groupBy(postTexts.postId);

  // 2. Grab the external texts if any
  return res;
}
