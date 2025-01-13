import { workerProcess } from "@andrioid/atproto/worker/main";

workerProcess().catch((err) => {
  console.error(err);
  process.exit(1);
});
