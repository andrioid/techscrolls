import { createAtContext } from "@andrioid/atproto";
import { train } from "@andrioid/atproto/classifiers/tfjs/train";

export default async function trainClassifierTask() {
  const ctx = await createAtContext();
  await train(ctx);
}
