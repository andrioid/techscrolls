import { postTable } from "../domain/post/post.table";

export const feedResult = {
  id: postTable.id,
  //repost: repostSubquery,
  date: postTable.created,
};
