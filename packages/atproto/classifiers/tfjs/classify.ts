import tf from "@tensorflow/tfjs-node";
import type { FeedPostWithUri } from "../../domain/queue-for-classification";
import { encodeText } from "./encodeText";

export async function classify({
  model,
  uniqueWords,
  wordIndex,
  post,
}: {
  post: FeedPostWithUri;
  model: tf.LayersModel;
  uniqueWords: Array<string>;
  wordIndex: Record<string, number>;
}) {
  // Predict for a new sample (testing)
  const text = post.record.text;
  if (!text) return;
  const inputEncoding = encodeText(text, uniqueWords, wordIndex);

  const prediction = model.predict(tf.tensor2d([inputEncoding])) as tf.Tensor;
  const arr = (await prediction.array()) as number[][];
  const prob = Math.round(arr[0][0] * 100);

  if (prob > 60) {
    return {
      postId: post.uri,
      text: text,
      tag: "tech",
      score: prob,
    };
  }
  // nothing interesting
}
