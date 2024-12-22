import { createAtContext } from "@andrioid/atproto";
import { defineMiddleware } from "astro:middleware";

const atContext = await createAtContext();

export const onRequest = defineMiddleware((context, next) => {
  context.locals.at = atContext;
  next();
});
