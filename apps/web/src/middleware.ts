import { createAtContext, type AtContext } from "@andrioid/atproto";
import { defineMiddleware } from "astro:middleware";
let atContext: AtContext | undefined;
try {
  atContext = await createAtContext();
} catch (err) {
  console.error(err);
  console.log("Failed to get atContext");
  process.exit(1);
}

export const onRequest = defineMiddleware((context, next) => {
  context.locals.at = atContext;
  next();
});
