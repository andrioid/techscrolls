// @ts-check
import node from "@astrojs/node";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
    output: "server",
    integrations: [react(), tailwind({
        applyBaseStyles: false,
    })],
    adapter: node({
        mode: "middleware",
    })
});
