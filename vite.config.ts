import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import checker from "vite-plugin-checker";

export default defineConfig({
  base: "/gephi-lite",
  plugins: [
    react(),
    checker({
      typescript: {
        buildMode: true,
      },
      eslint: {
        lintCommand: "eslint --ext .ts,.tsx,.js,.jsx src",
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
