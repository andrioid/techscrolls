import tf from "@tensorflow/tfjs-node";
import { encodeText } from "./encodeText";

export async function classify({
  model,
  uniqueWords,
  wordIndex,
  postUri,
  text,
}: {
  text: string;
  postUri: string;
  model: tf.LayersModel;
  uniqueWords: Array<string>;
  wordIndex: Record<string, number>;
}) {
  // Predict for a new sample (testing)
  if (!text || !postUri) return;
  const inputEncoding = encodeText(text, uniqueWords, wordIndex);
  const prediction = model.predict(tf.tensor2d([inputEncoding])) as tf.Tensor;
  const arr = (await prediction.array()) as number[][];
  const prob = Math.round(arr[0][0] * 100);

  return {
    postId: postUri,
    text: text,
    tag: "tech",
    score: prob,
  };
  // nothing interesting
}
