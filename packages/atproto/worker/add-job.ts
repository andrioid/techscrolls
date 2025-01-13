import { config } from "@andrioid/atproto/config";
import type { UpdateFollowersTaskType } from "@andrioid/atproto/worker/tasks/update-followers";
import type { Job, TaskSpec } from "graphile-worker";
import { makeWorkerUtils } from "graphile-worker";

export const workerUtils = await makeWorkerUtils({
  connectionString: config.pgURL,
});

type AddJobFnArgs = UpdateFollowersTaskType;

type AddJobFn = (...args: AddJobFnArgs) => Promise<Job>;

export const addJob: AddJobFn = (...args) => {
  const taskSpec: TaskSpec = {
    queueName: args[0],
    maxAttempts: 2,
    ...args[2],
  };
  return workerUtils.addJob(args[0], args[1], args[2]);
};
