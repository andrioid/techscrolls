export const config = (() => {
  const identifier = process.env["DID_HANDLE"];
  const password = process.env["DID_PASSWORD"];
  const port = process.env["port"] ?? 8080;

  if (!identifier || !password) throw Error("Missing config");

  // TODO: Make this understand DEV vs Server
  return {
    identifier,
    password,
    port,
  };
})();
