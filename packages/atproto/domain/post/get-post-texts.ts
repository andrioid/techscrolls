import { and, eq, isNotNull, sql } from "drizzle-orm";
import type { AtContext } from "../../context";
import { externalTable } from "../external/external.table";
import type { ExtractedTextType } from "../extract-text-from-post";
import { postExternals } from "./post-externals.table";
import { postTexts } from "./post-texts.table";

// Use cases
// - For training (only manual tags)
// - For classifying (specific post id)
// - Include external texts if any
export async function getPostTexts(ctx: AtContext) {
  const externalTextSQ = ctx.db
    .select({
      postId: postExternals.postId,
      text: externalTable.markdown,
    })
    .from(postExternals)
    .innerJoin(externalTable, eq(postExternals.url, externalTable.url))
    .where(isNotNull(externalTable.lastCrawled))
    .as("sq_externaltext");

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
    .innerJoin(externalTextSQ, eq(postTexts.postId, externalTextSQ.postId))
    .where(and()) // TODO: Finish this
    .groupBy(postTexts.postId);

  // 2. Grab the external texts if any
  return res;
}
