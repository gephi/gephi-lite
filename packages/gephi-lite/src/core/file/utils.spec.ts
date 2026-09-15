import { describe, expect, it } from "vitest";

import FILE_GEXF from "./testGraphs/Les Miserables.gexf?raw";
import FILE_GEPHILITE from "./testGraphs/Les Miserables.json?raw";
import FILE_GRAPHML from "./testGraphs/airlines.graphml?raw";
import FILE_GRAPHOLOGY from "./testGraphs/graphology.json?raw";
import { extractGraphFromFile } from "./utils";

const SAMPLES: {
  content: string;
  fileName: string;
  format: string;
}[] = [
  {
    content: FILE_GRAPHML,
    fileName: "airlines.graphml",
    format: "graphml",
  },
  {
    content: FILE_GEPHILITE,
    fileName: "Les Miserables.json",
    format: "gephi-lite",
  },
  {
    content: FILE_GEXF,
    fileName: "Les Miserables.gexf",
    format: "gexf",
  },
  {
    content: FILE_GRAPHOLOGY,
    fileName: "Graphology",
    format: "graphology",
  },
];

describe("extractGraphFromFile", () => {
  for (const { fileName, content, format } of SAMPLES) {
    it(`Sample dataset "${fileName}" should work`, async () => {
      const parsed = await extractGraphFromFile(content, fileName);
      expect(parsed.format).toBe(format);
    });
  }
});
