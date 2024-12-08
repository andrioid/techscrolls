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
};
