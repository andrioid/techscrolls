import {
  createAtContext,
  fetchMissingPostRecords,
  listenForPosts,
} from "@andrioid/atproto";

async function main() {
  const atContext = await createAtContext();
  await fetchMissingPostRecords(atContext);
  await listenForPosts(atContext);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
