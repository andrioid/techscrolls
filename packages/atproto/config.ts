export const config = (() => {
  const isFlyDev = !!process.env["FLY_DEV"];
  const identifier = process.env["DID_HANDLE"];
  const password = process.env["DID_PASSWORD"];
  const port = process.env["PORT"] ?? 3000;
  const fgHostname = process.env["FEEDGEN_HOSTNAME"] ?? "technical.scrolls.org";
  const recordName = "testfeed";
  const fallBackPgUrl = "postgres://devuser:devpass@localhost:5432/devdb";
  let pgURL =
    process.env["PG_URL"] ?? process.env["DATABASE_URL"] ?? fallBackPgUrl;
  if (isFlyDev) {
    pgURL = process.env["PROD_PG_URL"] ?? fallBackPgUrl;
  }

  if (!identifier || !password)
    throw Error("DID_HANDLE or DID_PASSWORD missing");
  if (!fgHostname) throw new Error("FEEDGEN_HOSTNAME missing");
  return {
    port,
    identifier,
    password,
    feedGenDid: process.env.FEEDGEN_SERVICE_DID ?? `did:web:${fgHostname}`,
    feedGenHostname: fgHostname,
    recordName,
    pgURL,
  };
})();
