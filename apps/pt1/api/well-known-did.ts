import { config } from "../config";
import type { HandlerFn } from "./types";

export const wellKnownDidHandler: HandlerFn = async (req) => {
  const res = Response.json({
    "@context": ["https://www.w3.org/ns/did/v1"],
    id: config.feedGenDid,
    service: [
      {
        id: "#bsky_fg",
        type: "BskyFeedGenerator",
        serviceEndpoint: `https://${config.feedGenHostname}`,
      },
    ],
  });
  res.headers.set("cache-control", "max-age=600");
  return res;
};
