import { classifier } from "@andrioid/atproto/scripts/classifier";

classifier().catch((err) => {
  console.log("[classifier] app level error");
  console.error(err);
  process.exit(1);
});
