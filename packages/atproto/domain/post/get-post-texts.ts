import { and, sql, type SQL } from "drizzle-orm";
import type { AtContext } from "../../context";
import type { ExtractedTextType } from "../extract-text-from-post";
import { postTexts } from "./post-texts.table";

// Use cases
// - For training (only manual tags)
// - For classifying (specific post id)
// - Include external texts if any
export async function getPostTexts(
  ctx: AtContext,
  filters: Array<SQL | undefined>
): Promise<Array<ExtractedTextType>> {
  // 1. Find all the relevant post texts
  const res = await ctx.db
    .select({
      postUri: postTexts.postId,
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
    //.leftJoin(externalTable, eq())
    .where(and(...filters))
    .groupBy(postTexts.postId);

  // 2. Grab the external texts if any
  return [];
}
