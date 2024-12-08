export function tokenizeText(text: string) {
  // Remove punctuation and convert to lowercase
  const cleanedText = text.replace(/[^a-zA-Z\s]/g, "").toLowerCase();

  // Split the text into an array of words
  const tokens = cleanedText.split(/\s+/);

  return tokens;
}
