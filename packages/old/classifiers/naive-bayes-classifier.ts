import { tokenizeText } from "./tokenizer";

interface TrainingData {
  text: string;
  isPositive: boolean;
}

class NaiveBayesClassifier {
  private vocabulary: Set<string>;
  private positiveCounts: Map<string, number>;
  private negativeCounts: Map<string, number>;
  private positiveTotal: number;
  private negativeTotal: number;

  constructor(trainingData: TrainingData[]) {
    this.vocabulary = new Set();
    this.positiveCounts = new Map();
    this.negativeCounts = new Map();
    this.positiveTotal = 0;
    this.negativeTotal = 0;

    trainingData.forEach(({ text, isPositive }) => {
      const tokens = tokenizeText(text);
      tokens.forEach((token) => {
        this.vocabulary.add(token);
        const count = isPositive
          ? (this.positiveCounts.get(token) || 0) + 1
          : (this.negativeCounts.get(token) || 0) + 1;
        if (isPositive) {
          this.positiveCounts.set(token, count);
        } else {
          this.negativeCounts.set(token, count);
        }
      });
      if (isPositive) {
        this.positiveTotal += tokens.length;
      } else {
        this.negativeTotal += tokens.length;
      }
    });
  }

  classify(text: string): boolean {
    const tokens = tokenizeText(text);
    let positive = 0;
    let negative = 0;

    tokens.forEach((token) => {
      const positiveCount = this.positiveCounts.get(token) || 0;
      const negativeCount = this.negativeCounts.get(token) || 0;
      const totalPositiveCount = this.positiveTotal;
      const totalNegativeCount = this.negativeTotal;

      const positiveProbability =
        (positiveCount + 1) / (totalPositiveCount + this.vocabulary.size);
      const negativeProbability =
        (negativeCount + 1) / (totalNegativeCount + this.vocabulary.size);

      positive += Math.log(positiveProbability);
      negative += Math.log(negativeProbability);
    });

    return positive >= negative;
  }
}

export default NaiveBayesClassifier;
