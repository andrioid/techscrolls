import { classifyPost, getPostTags } from "@andrioid/atproto";
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
      match: z.boolean().nullable(),
      tag: z.string().default("tech"),
    }),
    handler: async (input, ctx) => {
      if (!ctx.locals.mayClassify) {
        throw new Error("Not authorized to classify");
      }
      await classifyPost(ctx.locals.at, {
        postUri: input.postUri,
        algorithm: "manual",
        score: input.match ? 100 : 0,
        tag: "tech",
      });
      // insert a manual tag on the post
    },
  }),
  getTagsForPost: defineAction({
    input: z.object({
      postUri: z.string(),
    }),
    handler: async (input, ctx) => {
      // TODO: Verify this later when we have proper session
      // if (!ctx.locals.mayClassify) {
      //   console.log("mayClassify", ctx.locals.mayClassify);
      //   return [];
      // }
      return getPostTags(ctx.locals.at, input.postUri);
    },
  }),
};
