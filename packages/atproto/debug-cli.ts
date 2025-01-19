import { createAtContext } from "./context";
import { scrapeUrl } from "./worker/tasks/scrape-external-url";

async function main() {
  const ctx = await createAtContext();
  //const res = await getPostTexts(ctx);
  //console.log(JSON.stringify(res, null, 2));
  const res = await scrapeUrl(
    "https://andri.dk/_astro/coffee-art.DJfGxfQ-_2kTFB0.webp"
  );
  console.log("file", res);
  const res2 = await scrapeUrl("https://andri.dk/now");
  console.log("page", res2);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
