import { classifyPost } from "@andrioid/atproto";
import { defineAction } from "astro:actions";
import { z } from "astro:schema";

export const server = {
  loginWithBluesky: defineAction({
    input: z.object({
      handle: z.string(),
    }),
    accept: "form",
    handler: async (input, ctx) => {
      console.log(`Canonical URL: ${ctx.site}${ctx.originPathname}`);

      //const url = new URL("/test", ctx.site);
      //console.log("url", url);

      // get session if any
      // create new session via oauth client

      return true;
    },
  }),
  classifyManually: defineAction({
    input: z.object({
      postUri: z.string(),
      match: z.boolean(),
      tag: z.string().default("tech"),
    }),
    handler: async (input, ctx) => {
      await classifyPost(ctx.locals.at, {
        postUri: input.postUri,
        algorithm: "manual",
        score: input.match ? 100 : 0,
        tag: "tech",
      });
      // insert a manual tag on the post
    },
  }),
};
