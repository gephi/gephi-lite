import { describe, expect, it } from "vitest";

import { getSampleSelectDetail, resolveSampleEntries, type SampleCatalogEntry } from "./samplePicker";

const entries: SampleCatalogEntry[] = [
  {
    name: "ネットワーク",
    nameEn: "Network",
    description: "説明",
    descriptionEn: "Description",
    format: "gexf",
    fileUrl: "https://example.test/network.gexf",
    compatibleTools: ["gephi-lite", "cytoscape"],
  },
  {
    name: "表",
    nameEn: "Table",
    description: "説明",
    descriptionEn: "Description",
    format: "csv",
    fileUrl: "https://example.test/table.csv",
    compatibleTools: ["rawgraphs/barchart"],
  },
];

describe("resolveSampleEntries", () => {
  it("keeps entries compatible with the requested tool", () => {
    expect(resolveSampleEntries(entries, "gephi-lite")).toEqual([entries[0]]);
  });

  it("matches qualified chart keys when provided", () => {
    expect(resolveSampleEntries(entries, "rawgraphs", "barchart")).toEqual([entries[1]]);
    expect(resolveSampleEntries(entries, "rawgraphs", "linechart")).toEqual([]);
  });
});

describe("getSampleSelectDetail", () => {
  it("returns locale-specific labels and urls", () => {
    const detail = getSampleSelectDetail(
      {
        ...entries[0],
        fileUrlEn: "https://example.test/network-en.gexf",
      },
      "en",
    );

    expect(detail).toMatchObject({
      url: "https://example.test/network-en.gexf",
      format: "gexf",
      name: "Network",
      nameEn: "Network",
    });
  });

  it("returns variant details when a variant is selected", () => {
    const detail = getSampleSelectDetail(entries[0], "ja", {
      label: "小",
      labelEn: "Small",
      fileUrl: "https://example.test/small.gexf",
    });

    expect(detail).toMatchObject({
      url: "https://example.test/small.gexf",
      name: "小",
      nameEn: "Small",
    });
  });
});
