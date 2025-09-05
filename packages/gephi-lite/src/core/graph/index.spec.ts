import { FieldModelAbstraction, FieldModelType, ITEM_TYPES, ItemType } from "@gephi/gephi-lite-sdk";
import { keyBy } from "lodash";
import { describe, expect, it } from "vitest";

import { extractGraphFromFile } from "../file/utils";
import DIVIDED_THEY_BLOG from "./testGraphs/divided-they-blog.gexf?raw";
import GEPHI_LITE from "./testGraphs/gephi-lite.gexf?raw";
import MARVEL from "./testGraphs/marvel-characters-by-stories.gexf?raw";
import SPOTIFY_ESPINOZA from "./testGraphs/spotify-veronica-espinoza.gexf?raw";
import WORLD_FLIGHT_ROUTES from "./testGraphs/world-flight-routes.gexf?raw";
import { initializeGraphDataset } from "./utils";

type ExpectedType<K extends FieldModelType = FieldModelType> = {
  type: K;
  options?: Partial<FieldModelAbstraction[K]["options"]>;
};

const SAMPLES: {
  content: string;
  fileName: string;
  expectedTypes: Partial<Record<ItemType, Record<string, ExpectedType>>>;
}[] = [
  {
    /**
     * This is the dataset from the paper:
     *
     * Lada A. Adamic and Natalie Glance. 2005.
     * The political blogosphere and the 2004 U.S. election: divided they blog.
     * In Proceedings of the 3rd international workshop on Link discovery (LinkKDD '05).
     * Association for Computing Machinery, New York, NY, USA, 36–43.
     * https://doi.org/10.1145/1134271.1134277
     */
    content: DIVIDED_THEY_BLOG,
    fileName: "divided-they-blog.gexf",
    expectedTypes: {
      nodes: {
        label: { type: "text" },
        size: { type: "number" },
        color: { type: "color" },
        value: { type: "boolean" },
        source: { type: "keywords", options: { separator: "," } },
      },
    },
  },
  {
    /**
     * This dataset comes from @ouestware's 2024 FOSDEM talk about Gephi Lite:
     * https://archive.fosdem.org/2024/schedule/event/fosdem-2024-3253-bridging-research-and-open-source-the-genesis-of-gephi-lite/
     */
    content: GEPHI_LITE,
    fileName: "gephi-lite.gexf",
    expectedTypes: {
      nodes: {
        label: { type: "text" },
        size: { type: "number" },
        color: { type: "color" },
        type: { type: "category" },
        degree: { type: "number" },
        rawSize: { type: "number" },
        start_year: { type: "date", options: { format: "yyyy" } },
        image: { type: "url" },
        url: { type: "url" },
      },
      edges: {
        weight: { type: "number" },
        color: { type: "color" },
        rawWeight: { type: "number" },
        type: { type: "category" },
      },
    },
  },
  {
    /**
     * This dataset comes from @boogheta's marvel-graphs.net website:
     * https://www.marvel-graphs.net/#/characters/
     */
    content: MARVEL,
    fileName: "marvel-characters-by-stories.gexf",
    expectedTypes: {
      nodes: {
        label: { type: "text" },
        image: { type: "text" },
        image_url: { type: "url" },
        url: { type: "url" },
        stories: { type: "number" },
        description: { type: "text" },
      },
    },
  },
  {
    /**
     * This dataset comes from Dr Veronica Espinoza's Medium blog:
     *
     * Learn how to make a network in Gephi-Lite and add images to the nodes
     * (I give you the GEXF file!)
     * https://medium.com/@vespinozag/learn-how-to-make-a-network-in-gephi-lite-and-add-images-to-the-nodes-i-give-you-the-gexf-file-76635f3aab53
     *
     * The GEXF itself is available at:
     * https://github.com/Veruka2021/Spotify-Network-Artist_2024_gexf/blob/main/Spotify%20Network%20Artist_Python_2024_Vero.gexf
     */
    content: SPOTIFY_ESPINOZA,
    fileName: "spotify-veronica-espinoza.gexf",
    expectedTypes: {
      nodes: {
        label: { type: "text" },
        image: { type: "url" },
        genre: { type: "keywords", options: { separator: "," } },
        followers: { type: "number" },
        popularity: { type: "number" },
      },
    },
  },
  {
    /**
     * Unknown data origin
     */
    content: WORLD_FLIGHT_ROUTES,
    fileName: "world-flight-routes.gexf",
    expectedTypes: {
      nodes: {
        label: { type: "text" },
        size: { type: "number" },
        color: { type: "color" },
        lon: { type: "number" },
        lat: { type: "number" },
        tz: { type: "number" },
        city: { type: "text" },
        iata: { type: "text" },
        dst: { type: "category" },
        country: { type: "category" },
      },
      edges: {
        label: { type: "text" },
        weight: { type: "number" },
        color: { type: "color" },
        frequency: { type: "number" },
      },
    },
  },
];

describe("Full dataset types inference", () => {
  for (const { fileName, expectedTypes, content } of SAMPLES) {
    describe(`Sample dataset "${fileName}"`, async () => {
      const { data, metadata, format } = await extractGraphFromFile(content, fileName);
      if (format === "gephi-lite") throw new Error("gephi-lite format not supported in these tests yet");

      const { nodeFields, edgeFields } = initializeGraphDataset(data, metadata);
      const types = {
        nodes: keyBy(nodeFields, "id"),
        edges: keyBy(edgeFields, "id"),
      };

      for (const key of ITEM_TYPES) {
        const itemType = key as ItemType;
        for (const field in expectedTypes[itemType] || {}) {
          const { type: expectedType, options: expectedOptions } = expectedTypes[itemType]![field];
          const inferredType = types[itemType][field];

          it(
            `should detect type "${expectedType}" for ${itemType} field "${field}"` +
              (expectedOptions ? ` (with options ${JSON.stringify(expectedOptions)})` : ""),
            () => {
              expect(inferredType.type).toEqual(expectedType);
              if (expectedOptions) {
                for (const option in expectedOptions) {
                  expect(option in inferredType).toBeTruthy();
                  expect(inferredType[option as keyof typeof inferredType]).toEqual(
                    (expectedOptions as Record<string, unknown>)[option],
                  );
                }
              }
            },
          );
        }
      }
    });
  }
});
