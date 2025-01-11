import { createAtContext, fetchMissingPostRecords } from "@andrioid/atproto";

export default async function fetchMissingPostRecordsTask(
  payload: unknown,
  helpers: unknown
) {
  const ctx = await createAtContext();
  await fetchMissingPostRecords(ctx);
}
