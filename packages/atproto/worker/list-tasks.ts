import { getTasks } from "graphile-worker";
import { config } from "../config";
import preset from "./graphile.config";

// TODO: Would be nice sometime to run tasks from admin interface.
// - Probably best to create a constant with all the available jobs and use keyof that
export async function listTasks() {
  const taskPath = preset.worker?.taskDirectory;
  if (!taskPath) {
    return;
  }
  const tasks = await getTasks(
    {
      connectionString: config.pgURL,
    },
    taskPath
  );
}
