import { beforeEach, describe, it } from "vitest";

import { resetStates } from "../context/dataContexts";
import { open } from "./index";
import v0_6_3 from "./testGraphs/Les Miserables-v0.6.3.json?raw";
import v1_0_0 from "./testGraphs/Les Miserables-v1.0.0.json?raw";

const FILES = [
  { filename: "v0.6.3.json", content: v0_6_3 },
  { filename: "v1.0.0.json", content: v1_0_0 },
];

describe("File", () => {
  beforeEach(() => resetStates(true));

  FILES.forEach((f) =>
    it(`opening ${f.filename} should work`, async () => {
      const fileToImport = new File([f.content], f.filename);
      await open({
        type: "local",
        updatedAt: new Date(),
        size: fileToImport.size,
        source: fileToImport,
        filename: f.filename,
      });
    }),
  );
});
