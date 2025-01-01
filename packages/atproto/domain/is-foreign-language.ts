import lande from "lande";

export function isForeignLanguage(text: string): boolean {
  const langProb = lande(text);
  // Too short to classify
  if (text.length < 30) return false;
  const [firstLang, pb] = langProb[0];
  if (firstLang !== "eng" && pb > 1) {
    console.log("[language] probably not english", langProb);
    return true;
  }

  return false; // We just don't know
}
