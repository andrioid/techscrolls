export const config = (() => {
  const identifier = process.env["DID_HANDLE"];
  const password = process.env["DID_PASSWORD"];
  const port = process.env["PORT"] ?? 3000;
  const fgHostname =
    process.env["FEEDGEN_HOSTNAME"] ?? "2a21-87-104-249-212.ngrok-free.app";
  const recordName = "testfeed";
  const sqliteFile = process.env["SQLITE_FILE"] ?? "app.db";

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
    sqliteFile,
  };
})();
