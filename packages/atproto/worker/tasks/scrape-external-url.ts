import { eq } from "drizzle-orm";
import type { TaskSpec } from "graphile-worker";
import processes from "node:child_process";
import { createAtContext } from "../../context";
import {
  externalTable,
  insertExternal,
} from "../../domain/external/external.table";

export type ScrapeExternalUrlType = [
  identifier: "scrape-external-url",
  payload: {
    url: string;
  },
  spec?: TaskSpec
];

function isStringBuffer(buffer: Buffer) {
  const text = buffer.toString("utf8");
  // Check for non-printable or unusual characters
  const nonPrintableCharacters = /[\x00-\x08\x0E-\x1F\x7F-\x9F]/;
  return !nonPrintableCharacters.test(text);
}

export async function scrapeUrl(url: string) {
  const papeer = `papeer`;
  return new Promise((resolve, reject) => {
    let data: string;

    const res = processes.spawn(`${papeer} get --stdout ${url}`, {
      shell: true,
      cwd: "/tmp",
    });
    //res.stdout.setEncoding("utf8");
    res.stdout.on("data", (dat: Buffer) => {
      if (!isStringBuffer(dat)) {
        throw new Error("Binary streams are not supported for text extraction");
      }
      data = dat.toString("utf8");
    });
    res.on("close", (exitCode) => {
      if (exitCode !== 0) {
        reject(new Error("Command failed"));
      } else {
        if (data.length === 0)
          throw new Error("Empty string returned from page");
        resolve(data);
      }
    });
  });
}

export default async function scrapeExternalUrlTask(
  payload: ScrapeExternalUrlType[1]
) {
  const ctx = await createAtContext();

  const res = await ctx.db
    .select()
    .from(externalTable)
    .where(eq(externalTable.url, payload.url));
  // Check if we can find papeer
  if (res.length > 0) return; // Already processed

  const scraped = await scrapeUrl(payload.url);
  const MAX_LENGTH = 5000;
  if (typeof scraped !== "string" || scraped.length > MAX_LENGTH) {
    return;
  }
  const truncatedScraped = scraped.slice(0, MAX_LENGTH);

  // Run papeer against the URL

  // Store MAX_LENGTH of the received text in externalTable
  await ctx.db
    .insert(externalTable)
    .values(
      insertExternal.parse({
        url: payload.url,
        markdown: truncatedScraped,
        lastCrawled: new Date(),
      })
    )
    .onConflictDoNothing();
}
