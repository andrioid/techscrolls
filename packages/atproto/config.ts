export const config = (() => {
  const identifier = process.env["DID_HANDLE"];
  const password = process.env["DID_PASSWORD"];
  const port = process.env["PORT"] ?? 3000;
  const fgHostname = process.env["FEEDGEN_HOSTNAME"] ?? "techscrolls.fly.dev";
  const recordName = "testfeed";
  const pgURL =
    process.env["PG_URL"] ?? "postgres://devuser:devpass@localhost:5432/devdb";

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
