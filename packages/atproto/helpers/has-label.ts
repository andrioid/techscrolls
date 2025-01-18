export function hasLabel(v: unknown, label: Array<string>): boolean | null {
  if (v === undefined || v === null) {
    return false;
  }
  if (!Array.isArray(v)) throw new Error("Label variable not array");
  const labels = v as Array<string>;
  return labels.some((l) => label.includes(l));
}
