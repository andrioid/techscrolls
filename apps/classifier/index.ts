import { classifier } from "@andrioid/atproto";

classifier()
  .catch((err) => {
    console.log("[classifier] app level error");
    console.error(err);
    process.exit(1);
  })
  .then(() => {
    process.exit(0);
  });
