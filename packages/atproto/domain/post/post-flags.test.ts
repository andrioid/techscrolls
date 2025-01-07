import { expect, test } from "bun:test";
import { PostFlags } from "./post-flags";

test("BitFlags.From", () => {
  const bodyAndEmbedMedia = PostFlags.Body | PostFlags.EmbedImages;
  const mask = 9;
  expect(mask & bodyAndEmbedMedia).not.toBe(0);

  //expect(origin.has(ContentFlags.EmbedMedia)).toBe(false);
});
