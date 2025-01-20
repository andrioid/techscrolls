import { config } from "@andrioid/atproto/config";
import type { UpdateFollowersTaskType } from "@andrioid/atproto/worker/tasks/update-followers";
import type { Job } from "graphile-worker";
import { makeWorkerUtils } from "graphile-worker";
import type { QueuePostWithRecordForProcessing } from "./tasks/queue-jetstream-post";
import type { QueueRepostWithRecordForProcessing } from "./tasks/queue-jetstream-repost";
import type { ScrapeExternalUrlType } from "./tasks/scrape-external-url";

export const workerUtils = await makeWorkerUtils({
  connectionString: config.pgURL,
});

type AddJobFnArgs =
  | UpdateFollowersTaskType
  | ScrapeExternalUrlType
  | QueuePostWithRecordForProcessing
  | QueueRepostWithRecordForProcessing;

type AddJobFn = (...args: AddJobFnArgs) => Promise<Job>;

export const addJob: AddJobFn = async (...args) => {
  return workerUtils.addJob(args[0], args[1], {
    maxAttempts: 2,
  });
};
