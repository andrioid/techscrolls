import { ilike } from "drizzle-orm";
import type { AtContext } from "../../context";
import { postTexts } from "../../domain/post/post-texts.table";

export function textSearchSubQuery(db: AtContext["db"], query = "") {
  return db
    .selectDistinct({
      postId: postTexts.postId,
    })
    .from(postTexts)
    .groupBy(postTexts.postId, postTexts.text)
    .having(ilike(postTexts.text, `%${query}%`))
    .as("textsearch_sq");
}
