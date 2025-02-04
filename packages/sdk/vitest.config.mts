import { defineConfig } from "vitest/config";

export default defineConfig({
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
});
