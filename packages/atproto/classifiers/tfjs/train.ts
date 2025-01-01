import tf from "@tensorflow/tfjs-node";
import { and, eq, sql } from "drizzle-orm";
import type { AtContext } from "../../context";
import {
  embedText,
  type ExtractedTextType,
} from "../../domain/extract-text-from-post";
import { postTags } from "../../domain/post/post-tag.table";
import { postTexts } from "../../domain/post/post-texts.table";
import { featureExtractor } from "./feature-extraction";
import { ModelPersistance } from "./tf-iohandler";

export async function train(ctx: AtContext) {
  // 1. Fetch all of the manual tags for "tech"
  const allTrainingPosts = ctx.db
    .select({
      postId: postTags.postId,
      tag: postTags.tagId,
      score: postTags.score,
    })
    .from(postTags)
    .where(and(eq(postTags.algo, "manual"), eq(postTags.tagId, "tech")))
    .as("allTrainingPosts");

  const res = await ctx.db
    .select({
      tag: allTrainingPosts.tag,
      score: allTrainingPosts.score,
      texts: sql<
        Array<{
          text: string;
          type: ExtractedTextType;
        }>
      >`json_agg(
        json_build_object(
            'text', ${postTexts.text},
            'type', ${postTexts.source}
        )
      )`,
    })
    .from(postTexts)
    .innerJoin(allTrainingPosts, eq(postTexts.post_id, allTrainingPosts.postId))
    .groupBy(postTexts.post_id, allTrainingPosts.tag, allTrainingPosts.score);

  // What the f. do I need here, really?
  // 1. List of { text, tag, score }

  const labeledData = res
    .filter((item) => {
      if (item.texts.length === 0) return false;
      return true;
    })
    .map((item) => {
      let text = embedText(item.texts);
      return {
        text,
        label: item.score === 100 ? item.tag : `not:${item.tag}`,
      };
    });

  const trainingData: string[] = labeledData.map((item) => item.text);
  const trainingDataLabels: string[] = labeledData.map((item) => item.label);

  const features = featureExtractor(trainingData, trainingDataLabels);
  if (features.length === 0) {
    console.log("[classifier] Cannot train, no features found", features);
    process.exit(1);
  }

  const uniqueWords = Array.from(
    new Set(features.flatMap((item) => item.features))
  );
  const wordIndex: { [key: string]: number } = uniqueWords.reduce(
    (acc, word, i) => {
      acc[word] = i;
      return acc;
    },
    {} as Record<string, number>
  );

  // Convert features to one-hot encoding
  const oneHotEncodedFeatures = features.map((item) => {
    const encoding: Array<number> = new Array(uniqueWords.length).fill(0);
    item.features.forEach((word) => {
      const index = wordIndex[word];
      if (index !== undefined) {
        encoding[index] = 1;
      }
    });
    return encoding;
  });

  // Convert labels to binary (0 for non-tech, 1 for tech)
  const labels = features.map((item) => (item.label === "tech" ? 1 : 0));

  //console.log("One-hot encoded features:", oneHotEncodedFeatures);
  //console.log("Labels:", labels);
  // Convert one-hot features and labels into tensors
  const featureTensor = tf.tensor2d(oneHotEncodedFeatures);
  const labelTensor = tf.tensor1d(labels, "int32");

  // Build a simple neural network model
  const model = tf.sequential();

  // Add layers to the model
  model.add(
    tf.layers.dense({
      units: 64,
      activation: "relu",
      inputShape: [uniqueWords.length],
    })
  );
  model.add(tf.layers.dense({ units: 32, activation: "relu" }));
  model.add(tf.layers.dense({ units: 1, activation: "sigmoid" })); // Binary output (tech vs non-tech)

  // Compile the model with binary crossentropy loss and an optimizer
  model.compile({
    loss: "binaryCrossentropy",
    optimizer: "adam",
    metrics: ["accuracy"],
  });

  // Train the model
  await model.fit(featureTensor, labelTensor, {
    epochs: 20,
    batchSize: 2,
  });

  await model.save(
    new ModelPersistance({ ctx, modelName: "tech", uniqueWords, wordIndex })
  );

  return {
    model,
    uniqueWords,
    wordIndex,
  };
}
