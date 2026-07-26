import UnpluginTypia from "@ryoppippi/unplugin-typia/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [UnpluginTypia({})],
  test: {
    globals: true,
    browser: {
      provider: "playwright",
      instances: [
        {
          browser: "chromium",
        },
      ],
      enabled: true,
      headless: true,
    },
  },
  optimizeDeps: {
    exclude: ["chromium-bidi"],
  },
});
