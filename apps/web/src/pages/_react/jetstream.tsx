import { useEffect, useState } from "react";

export function JetStream() {
  const [filter, setFilter] = useState();

  useEffect(() => {
    return; // later
    const wss = new WebSocket(
      "wss://jetstream2.us-east.bsky.network/subscribe?wantedCollections=app.bsky.feed.post"
    );
    wss.addEventListener("open", () => {
      console.log("wss open");
    });
    wss.addEventListener("message", (ev) => {
      const data = ev.data as string;
      if (data.match(/bluesky/)) {
        console.log("post", JSON.parse(data));
      }
    });

    return () => {
      wss.close();
    };
  }, []);

  return <div>Welcome to the stream</div>;
}
