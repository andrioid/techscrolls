export function normalizeUrl(url: string): string {
  const parsedUrl = new URL(url);
  parsedUrl.protocol = parsedUrl.protocol.toLowerCase();
  parsedUrl.hostname = parsedUrl.hostname.toLowerCase();
  parsedUrl.pathname = parsedUrl.pathname.toLowerCase();
  parsedUrl.search = "";
  return parsedUrl.toString();
}
