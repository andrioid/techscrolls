import natural from "natural";

export function encodeText(
  text: string,
  uniqueWords: Array<string>,
  wordIndex: Record<string, number>
) {
  const tokenizer = new natural.WordTokenizer();
  const tfidf = new natural.TfIdf();

  const tokens = tokenizer.tokenize(text);
  const ngrams = natural.NGrams.bigrams(tokens).join(" ");
  const tfidfTerms = tfidf
    .listTerms(0)
    .map((item) => item.term)
    .join(" ");

  // One-hot encode the new sample's features
  const inputFeatures = [...ngrams.split(" "), ...tfidfTerms.split(" ")];
  const inputEncoding = new Array(uniqueWords.length).fill(0);
  inputFeatures.forEach((word) => {
    const index = wordIndex[word];
    if (index !== undefined) {
      inputEncoding[index] = 1;
    }
  });

  return inputEncoding;
}
