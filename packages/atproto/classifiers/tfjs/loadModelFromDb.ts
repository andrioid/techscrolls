import tf from "@tensorflow/tfjs-node";
import { eq } from "drizzle-orm";
import type { AtContext } from "../../context";
import { tfjsModels } from "../../db/schema";
import { ModelPersistance } from "./tf-iohandler";

export async function loadModelFromDb(
  ctx: AtContext,
  modelName: string = "tech"
) {
  const res = await ctx.db
    .select()
    .from(tfjsModels)
    .where(eq(tfjsModels.name, modelName));
  if (!res || res.length === 0) {
    throw new Error("Could not find model in DB");
  }

  const model = await tf.loadLayersModel(
    new ModelPersistance({ ctx, modelName })
  );

  const modelConf = res[0];
  if (!modelConf.uniqueWords) throw new Error("uniqueWords missing");
  if (!modelConf.wordIndex) throw new Error("wordIndex missing");
  return {
    model,
    uniqueWords: modelConf.uniqueWords,
    wordIndex: modelConf.wordIndex,
  };
}
