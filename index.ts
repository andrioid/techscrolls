import { CredentialManager, XRPC } from "@atcute/client";

const config = (() => {
  const identifier = process.env["DID_HANDLE"];
  const password = process.env["DID_PASSWORD"];
  if (!identifier || !password) throw Error("Missing config");
  return {
    identifier,
    password,
  };
})();

async function main() {
  const manager = new CredentialManager({
    service: "https://bsky.social",
  });
  const rpc = new XRPC({ handler: manager });

  await manager.login({
    identifier: config.identifier,
    password: config.password,
  });

  console.log("manager session", manager.session);

  // TODO: Implement cursor
  const wss = new WebSocket(
    "wss://jetstream2.us-east.bsky.network/subscribe?wantedCollections=app.bsky.feed.post"
  );
  wss.addEventListener("open", () => {
    console.log("wss open");
  });
  wss.addEventListener("message", (ev) => {
    const data = ev.data as string;
    if (data.match(/github/)) {
      console.log("wss msg", JSON.parse(data));
    }
  });
}

main().catch((err) => {
  console.error(err);
});
