import { run } from "graphile-worker";
import preset from "./graphile.config";

async function main() {
  const runner = await run({ preset });

  runner.events.on("job:complete", () => {
    // Trigger Bun's GC manually after a job finishes
    Bun.gc(false);
  });

  await runner.promise;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
