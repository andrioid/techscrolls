import tf from "@tensorflow/tfjs-node";
import { and, desc, eq } from "drizzle-orm";
import natural from "natural";
import { createAtContext, type AtContext } from "../context";
import { postRecords, postTable, postTags, tfjsModels } from "../db/schema";
import { ModelPersistance } from "../helpers/tf-iohandler";

const tokenizer = new natural.WordTokenizer();
const tfidf = new natural.TfIdf();

async function train(ctx: AtContext) {
  // 1. Fetch all of the manual tags for "tech"
  const res = await ctx.db
    .select({
      value: postRecords.value,
      tag: postTags.tagId,
      score: postTags.score,
    })
    .from(postTags)
    .innerJoin(postRecords, eq(postTags.postId, postRecords.postId))
    .where(and(eq(postTags.algo, "manual"), eq(postTags.tagId, "tech")));

  const labeledData = res
    .filter((item) => {
      if (item.value === null) return false;
      return true;
    })
    .map((item) => {
      const val = item.value as Exclude<typeof item.value, null>;
      return {
        text: val.text,
        label: item.score === 100 ? item.tag : `not:${item.tag}`,
      };
    });
  const trainingData: string[] = labeledData.map((item) => item.text);
  const trainingDataLabels: string[] = labeledData.map((item) => item.label);

  for (const doc of trainingData) {
    tfidf.addDocument(doc);
  }

  const features = trainingData.map((doc) => {
    const tokens = tokenizer.tokenize(doc);
    const ngrams = natural.NGrams.bigrams(tokens).join(" ");
    const tfidFeatures = tfidf.listTerms(0).map((item) => item.term);
    return {
      features: [...ngrams.split(" "), ...tfidFeatures],
      label: trainingDataLabels[trainingData.indexOf(doc)],
    };
  });

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
    const encoding = new Array(uniqueWords.length).fill(0);
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
    //metrics: ["accuracy"],
  });

  // Train the model
  await model.fit(featureTensor, labelTensor, {
    epochs: 20,
    batchSize: 2,
  });

  await model.save(
    new ModelPersistance({ ctx, modelName: "tech", uniqueWords, wordIndex })
  );
  await model.save("file://techmodel.tmp"); // TODO: Remove

  model.summary();
  return {
    model,
    uniqueWords,
    wordIndex,
  };
}

async function classify(
  ctx: AtContext,
  {
    model,
    uniqueWords,
    wordIndex,
    onMatch,
  }: {
    model: tf.LayersModel;
    uniqueWords: Array<string>;
    wordIndex: Record<string, number>;
    onMatch: (args: {
      postId: string;
      tag: string;
      text: string;
    }) => Promise<void>;
  }
) {
  // Predict the class for the new sample
  const unlabeledPosts = await ctx.db
    .select({
      uri: postTable.id,
      value: postRecords.value,
    })
    .from(postTable)
    .innerJoin(postRecords, eq(postTable.id, postRecords.postId))
    .orderBy(desc(postTable.created));
  //.limit(40);

  console.log("[classify]", uniqueWords.length, Object.keys(wordIndex).length);

  for (const pr of unlabeledPosts) {
    // Predict for a new sample (testing)
    const text = pr.value?.text;
    if (!text) continue;
    const tokens = tokenizer.tokenize(text);
    const ngrams = natural.NGrams.bigrams(tokens).join(" ");
    const tfidfTerms = tfidf
      .listTerms(0)
      .map((item) => item.term)
      .join(" ");

    // One-hot encode the new sample's features
    const sampleFeatures = [...ngrams.split(" "), ...tfidfTerms.split(" ")];
    const sampleEncoding = new Array(uniqueWords.length).fill(0);
    sampleFeatures.forEach((word) => {
      const index = wordIndex[word];
      if (index !== undefined) {
        sampleEncoding[index] = 1;
      }
    });

    const prediction = model.predict(
      tf.tensor2d([sampleEncoding])
    ) as tf.Tensor;
    const arr = (await prediction.array()) as number[][];
    if (arr[0][0] > 0.5) {
      await onMatch({
        postId: pr.uri,
        text: text,
        tag: "tech",
      });
    }
  }
}

async function loadModelFromDb(ctx: AtContext, modelName: string = "tech") {
  const res = await ctx.db
    .select()
    .from(tfjsModels)
    .where(eq(tfjsModels.name, modelName));
  if (!res || res.length === 0) {
    throw new Error("Could not find model in DB");
  }
  /*
  const model = await tf.loadLayersModel(
    new ModelPersistance({ ctx, modelName })
  );
  */
  const model = await tf.loadLayersModel("file://techmodel.tmp/model.json");

  const modelConf = res[0];
  if (!modelConf.uniqueWords) throw new Error("uniqueWords missing");
  if (!modelConf.wordIndex) throw new Error("wordIndex missing");
  model.summary();
  return {
    model,
    uniqueWords: modelConf.uniqueWords,
    wordIndex: modelConf.wordIndex,
  };
}
async function main() {
  const ctx = await createAtContext();
  // TODO: persist https://chatgpt.com/c/676bf1d6-534c-800a-9ed0-3e22823c7c4e
  //const trained = await train(ctx);
  const loaded = await loadModelFromDb(ctx);
  let matchesPerTrained = 0;
  let matchesPerLoaded = 0;
  /*
  await classify(ctx, {
    ...trained,
    onMatch: async (match) => {
      matchesPerTrained++;
    },
  });
  */

  await classify(ctx, {
    ...loaded,
    onMatch: async (match) => {
      matchesPerLoaded++;
    },
  });

  console.log("Tech matches", matchesPerTrained, matchesPerLoaded);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .then(() => {
    process.exit(0);
  });
