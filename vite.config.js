import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  // we need to disable automatic redirect on SPA
  // when local models are allowed, local config is checked first even for remote models
  // with spa it returns html instead of 404 and breaking the flow
  appType: "mpa",
  build: {
    target: "esnext",
  },
  worker: {
    format: "es",
  },
  resolve: {
    // Only bundle a single instance of Transformers.js
    // (shared by `@huggingface/transformers` and `kokoro-js`)
    dedupe: ["@huggingface/transformers"],
  },
});
