import { config } from "@andrioid/atproto/config";
import type { UpdateFollowersTaskType } from "@andrioid/atproto/worker/tasks/update-followers";
import type { Job, TaskSpec } from "graphile-worker";
import { makeWorkerUtils } from "graphile-worker";
import type { ScrapeExternalUrlType } from "./tasks/scrape-external-url";

export const workerUtils = await makeWorkerUtils({
  connectionString: config.pgURL,
});

type AddJobFnArgs = UpdateFollowersTaskType | ScrapeExternalUrlType;

type AddJobFn = (...args: AddJobFnArgs) => Promise<Job>;

export const addJob: AddJobFn = async (...args) => {
  const taskSpec: TaskSpec = {
    queueName: args[0], // DONT for now
    maxAttempts: 2,
    ...args[2],
  };
  return workerUtils.addJob(args[0], args[1], {
    maxAttempts: 2,
    queueName: args[0],
  });
};
