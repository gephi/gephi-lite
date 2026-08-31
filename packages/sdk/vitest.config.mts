import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    browser: {
      provider: "playwright",
      instances: [
        {
          browser: "chromium",
          launch: process.env.PLAYWRIGHT_EXECUTABLE_PATH
            ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH }
            : undefined,
        },
      ],
      enabled: true,
      headless: true,
    },
  },
});
