import mdx from "@mdx-js/rollup";
import UnpluginTypia from "@ryoppippi/unplugin-typia/vite";
import react from "@vitejs/plugin-react-swc";
import { execSync } from "node:child_process";
import { PluginOption } from "vite";
import checker from "vite-plugin-checker";
import svgr from "vite-plugin-svgr";
import { defineConfig } from "vitest/config";

import { BASE_URL } from "../../config";

// Best-effort commit hash: absent outside of a git checkout (a source tarball, some Docker
// contexts...), in which case the "About" popup falls back to not showing a commit at all rather
// than a misleading value.
function getGitCommitHash(): string | null {
  try {
    // No explicit cwd: vite.config.mts always runs with this package's directory as the working
    // directory (npm workspace scripts, or `vite` invoked directly from here), which is inside the
    // repo's git checkout.
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch (_e) {
    return null;
  }
}

export default defineConfig({
  base: BASE_URL,
  define: {
    __GIT_COMMIT_HASH__: JSON.stringify(getGitCommitHash()),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    UnpluginTypia({}),
    mdx() as unknown as PluginOption,
    react(),
    svgr(),
    checker({
      typescript: {
        buildMode: true,
      },
      eslint: {
        useFlatConfig: true,
        lintCommand: "eslint src --max-warnings=0",
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
    sourcemap: true,
  },
  server: {
    open: false,
    host: process.env.VITE_HOST || true,
    allowedHosts: process.env.VITE_ALLOWED_HOSTS?.split(","),
    proxy: {
      "^/_github/*": {
        target: "https://github.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/_github/, ""),
      },
    },
  },
});
