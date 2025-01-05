import { expect, test } from "bun:test";
import { BitFlags } from "../../helpers/bitmask";
import { ContentFlags } from "./content-flags";

test("BitFlags.From", () => {
  const flags = BitFlags.FromFlags<ContentFlags>(
    ContentFlags.ExternalLink,
    ContentFlags.EmbedRecord,
    ContentFlags.Body
  );
  const bitmask = flags.toBitmask();
  const origin = BitFlags.FromBitmask<ContentFlags>(bitmask);

  expect(origin.has(ContentFlags.Body)).toBe(true);
  expect(origin.has(ContentFlags.ExternalLink)).toBe(true);
  expect(origin.has(ContentFlags.EmbedRecord)).toBe(true);
  expect(origin.has(ContentFlags.EmbedMedia)).toBe(false);
});

test("For zero values", () => {
  const flags = BitFlags.FromBitmask<ContentFlags>(0);
  expect(flags.has(ContentFlags.Body)).toBe(false);
});

test("BitFlags constructor", () => {
  const mask = BitFlags.FromFlags<ContentFlags>(
    ContentFlags.Body,
    ContentFlags.EmbedMedia,
    ContentFlags.ExternalLink
  );
  expect(mask.has(ContentFlags.Body)).toBe(true);
  expect(mask.has(ContentFlags.ExternalLink)).toBe(true);
  expect(mask.has(ContentFlags.EmbedRecord)).toBe(false);
  expect(mask.has(ContentFlags.EmbedMedia)).toBe(true);
});

test("BitFlags.add", () => {
  const flags = BitFlags.FromBitmask<ContentFlags>(0);
  flags.add(ContentFlags.Body);
  expect(flags.has(ContentFlags.Body)).toBe(true);
  expect(flags.has(ContentFlags.ExternalLink)).toBe(false);
  expect(flags.has(ContentFlags.EmbedRecord)).toBe(false);
  expect(flags.has(ContentFlags.EmbedMedia)).toBe(false);
});
