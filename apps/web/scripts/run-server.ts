// @ts-check
import express from "express";
import { handler as ssrHandler } from "../dist/server/entry.mjs";

const app = express();
app.use("/", express.static("dist/client/"));
app.use(ssrHandler);

const port = process.env["PORT"] ?? 8080;
console.log("[astro] express listening at ", port);
app.listen(port);
