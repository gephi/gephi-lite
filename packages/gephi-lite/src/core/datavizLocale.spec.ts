import { describe, expect, it } from "vitest";

import { normalizeDatavizLocale, resolveDatavizLocale } from "./datavizLocale";

describe("dataviz locale utilities", () => {
  it("normalizes supported locale values", () => {
    expect(normalizeDatavizLocale("ja-JP")).toBe("ja");
    expect(normalizeDatavizLocale("en-US")).toBe("en");
    expect(normalizeDatavizLocale("fr-FR")).toBeNull();
  });

  it("resolves explicit lang query before cookie, html, and browser language", () => {
    expect(
      resolveDatavizLocale({
        locationRef: { href: "https://gephi-lite.dataviz.jp/?lang=ja" },
        documentRef: { cookie: "locale=en", documentElement: { lang: "en" } },
        navigatorRef: { language: "en-US" },
      }),
    ).toBe("ja");
  });

  it("resolves /en path before cookie and browser language", () => {
    expect(
      resolveDatavizLocale({
        locationRef: { href: "https://gephi-lite.dataviz.jp/en/" },
        documentRef: { cookie: "locale=ja", documentElement: { lang: "ja" } },
        navigatorRef: { language: "ja-JP" },
      }),
    ).toBe("en");
  });

  it("resolves locale cookie before html and browser language", () => {
    expect(
      resolveDatavizLocale({
        locationRef: { href: "https://gephi-lite.dataviz.jp/" },
        documentRef: { cookie: "session=abc; locale=ja", documentElement: { lang: "en" } },
        navigatorRef: { language: "en-US" },
      }),
    ).toBe("ja");
  });

  it("falls back to Japanese when no locale signal is available", () => {
    expect(
      resolveDatavizLocale({
        locationRef: { href: "https://gephi-lite.dataviz.jp/" },
        documentRef: { cookie: "", documentElement: { lang: "" } },
        navigatorRef: { language: "fr-FR" },
      }),
    ).toBe("ja");
  });
});
