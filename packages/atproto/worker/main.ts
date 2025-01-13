export * from "@andrioid/atproto/worker/add-job";
import { run } from "graphile-worker";
import preset from "./graphile.config";

export async function workerProcess() {
  const runner = await run({
    preset,
  });

  runner.events.on("job:complete", () => {
    // Trigger Bun's GC manually after a job finishes
    Bun.gc(false);
  });

  await runner.promise;
}
