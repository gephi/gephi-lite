import mdx from "@mdx-js/rollup";
import react from "@vitejs/plugin-react-swc";
import { PluginOption } from "vite";
import checker from "vite-plugin-checker";
import svgr from "vite-plugin-svgr";
import { defineConfig } from "vitest/config";

import { BASE_URL } from "../../config";

const enableChecker = process.env.VITEST !== "true";

export default defineConfig({
  base: BASE_URL,
  plugins: [
    mdx() as unknown as PluginOption,
    react(),
    svgr(),
    enableChecker
      ? checker({
          typescript: {
            buildMode: true,
          },
          eslint: {
            useFlatConfig: true,
            lintCommand: "eslint src --max-warnings=0",
          },
        })
      : false,
  ],
  resolve: {
    alias: {
      global: "window",
      "node-fetch": "isomorphic-fetch",
    },
  },
  test: {
    root: ".",
    globals: true,
    exclude: ["e2e", "node_modules"],
  },
  publicDir: "public",
  build: {
    outDir: "build",
    sourcemap: true,
  },
  server: {
    open: false,
    host: process.env.VITE_HOST || true,
    allowedHosts: process.env.VITE_ALLOWED_HOSTS?.split(","),
  },
});
