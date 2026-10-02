import { FieldModel } from "@gephi/gephi-lite-sdk";
import { describe, expect, it } from "vitest";

import { getValidStoredParameters } from "./utils";

const layout = {
  parameters: [
    { id: "latitudeField", type: "attribute", itemType: "nodes" },
    { id: "weightField", type: "attribute", itemType: "edges" },
    { id: "scale", type: "number" },
  ],
} as Parameters<typeof getValidStoredParameters>[0];
const nodeFields = [{ id: "lat", itemType: "nodes" }] as FieldModel[];
const edgeFields = [{ id: "weight", itemType: "edges" }] as FieldModel[];

describe("getValidStoredParameters", () => {
  it("should drop nil values and attribute values not matching an existing field", () => {
    expect(
      getValidStoredParameters(
        layout,
        { latitudeField: undefined, weightField: "oldField", scale: 2, other: null },
        nodeFields,
        edgeFields,
      ),
    ).toEqual({ scale: 2 });
  });

  it("should keep attribute values matching a field of the right item type", () => {
    expect(
      getValidStoredParameters(layout, { latitudeField: "lat", weightField: "weight" }, nodeFields, edgeFields),
    ).toEqual({ latitudeField: "lat", weightField: "weight" });
  });
});
