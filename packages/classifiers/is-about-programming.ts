import NaiveBayesClassifier from "./naive-bayes-classifier";

const trainingData = [
  {
    text: "This is a text about programming in JavaScript.",
    isAboutProgramming: true,
  },
  { text: "This is a text about cooking recipes.", isAboutProgramming: false },
  // Add more training data here
];

const classifier = new NaiveBayesClassifier(trainingData);

export const isAboutProgramming = (text: string): boolean => {
  return classifier.classify(text);
};
