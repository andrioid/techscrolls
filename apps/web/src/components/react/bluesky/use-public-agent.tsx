import AtpAgent from "@atproto/api";
import { useRef } from "react";

const myFetch =
  (init?: RequestInit) =>
  async (input: RequestInfo | URL, initDefaults?: RequestInit) => {
    const initCombines = {
      ...initDefaults,
      ...init,
    };
    console.log("requesting", input);

    const response = await globalThis.fetch(input, initCombines);
    console.log("got response", response);
    return response;
  };

export function usePublicAgent() {
  const agent = useRef(
    new AtpAgent({
      service: "https://public.api.bsky.app",
      //fetch: myFetch({ signal }),
    })
  );
  return agent.current;
}
