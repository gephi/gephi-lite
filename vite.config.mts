import UnpluginTypia from "@ryoppippi/unplugin-typia/vite";
import react from "@vitejs/plugin-react-swc";
import checker from "vite-plugin-checker";
import svgr from "vite-plugin-svgr";
import { defineConfig } from "vitest/config";

import { BASE_URL } from "./config";

export default defineConfig({
  base: BASE_URL,
  plugins: [
    UnpluginTypia({}),
    react(),
    svgr(),
    checker({
      typescript: {
        buildMode: true,
      },
      eslint: {
        lintCommand: "eslint --ext .ts,.tsx,.js,.jsx src --max-warnings=0",
      },
    }),
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
  build: {
    outDir: "build",
  },
  server: {
    open: false,
    proxy: {
      "^/_github/*": {
        target: "https://github.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/_github/, ""),
      },
    },
  },
});
