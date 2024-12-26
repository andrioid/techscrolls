import natural from "natural";

export function featureExtractor(texts: Array<string>, labels: Array<string>) {
  const tokenizer = new natural.WordTokenizer();
  const tfidf = new natural.TfIdf();

  for (const text of texts) {
    tfidf.addDocument(text);
  }

  const bigrams = texts.map((text) => {
    return natural.NGrams.bigrams(tokenizer.tokenize(text));
  });

  const features = texts.map((doc, index) => {
    const tokens = tokenizer.tokenize(doc);
    const ngrams = natural.NGrams.bigrams(tokens).join(" ");
    const tfidfTerms = tfidf
      .listTerms(index)
      .map((item) => item.term)
      .join(" "); // Extract terms for TF-IDF features
    return {
      features: [...ngrams.split(" "), ...tfidfTerms.split(" ")], // Combine n-grams and TF-IDF terms
      label: labels[index],
    };
  });

  return features;
}
