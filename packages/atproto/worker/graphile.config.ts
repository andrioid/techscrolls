import { config } from "@andrioid/atproto/config";
import { WorkerPreset } from "graphile-worker";
import path from "node:path";

const preset: GraphileConfig.Preset = {
  extends: [WorkerPreset],
  worker: {
    connectionString: config.pgURL,
    maxPoolSize: 10,
    pollInterval: 2000,
    preparedStatements: true,
    schema: "graphile_worker",
    crontabFile: path.join(import.meta.dirname, "./crontab"),
    taskDirectory: path.join(import.meta.dirname, "./tasks"),
    concurrentJobs: 1,
    fileExtensions: [".ts"],
  },
};

export default preset;
