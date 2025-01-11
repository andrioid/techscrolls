export function toCursor(d: Date | null): string | undefined {
  if (!d) return;
  // Convert date to unixtime string, in seconds
  return Math.floor(d.getTime() / 1000).toString();
}

export function fromCursor(c: string): Date {
  // Convert cursor string (unixtime) to Date
  return new Date(parseInt(c) * 1000);
}
