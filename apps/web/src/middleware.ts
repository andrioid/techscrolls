import { createAtContext, type AtContext } from "@andrioid/atproto";
import type { APIContext } from "astro";
import { defineMiddleware } from "astro:middleware";
let atContext: AtContext | undefined;
try {
  atContext = await createAtContext();
} catch (err) {
  console.error(err);
  console.log("Failed to get atContext");
  process.exit(1);
}

// This is only until I get Bluesky oauth running
const USER = "andri";
const PASSWORD = "devandri";

export const onRequest = defineMiddleware((context, next) => {
  const mayClassify = isAuthorized(context);
  context.locals.at = atContext;
  context.locals.mayClassify = mayClassify;
  // Doesn't apply to API urls
  const url = new URL(context.request.url);

  if (url.pathname.match(/(^\/admin)/)) {
    // Lock it down a bit
    if (mayClassify) {
      return next();
    } else {
      return new Response("Auth required", {
        status: 401,
        headers: {
          "WWW-authenticate": 'Basic realm="Secure Area"',
        },
      });
    }
  }

  return next();
});

function isAuthorized(context: APIContext): boolean {
  try {
    const basicAuth = context.request.headers.get("authorization");

    if (basicAuth) {
      // Get the auth value from string "Basic authValue"
      const authValue = basicAuth.split(" ")[1] ?? "username:password";

      // Decode the Base64 encoded string via atob (https://developer.mozilla.org/en-US/docs/Web/API/atob)
      // Get the username and password. NB: the decoded string is in the form "username:password"
      const [username, pwd] = atob(authValue).split(":");

      // check if the username and password are valid
      if (username === USER && pwd === PASSWORD) {
        // forward request
        return true;
      }
    }
  } catch (err) {
    // ignore
  }
  return false;
}
