import { type FieldModel } from "@gephi/gephi-lite-sdk";
import { describe, expect, it } from "vitest";

import {
  createFieldModel,
  deleteFieldModel,
  duplicateFieldModel,
  moveFieldModel,
  setFieldModel,
} from "./fieldModelProducers";
import { getEmptyGraphDataset } from "./utils";

const labelField: FieldModel<"nodes"> = {
  id: "label",
  itemType: "nodes",
  type: "text",
};

const scoreField: FieldModel<"nodes"> = {
  id: "score",
  itemType: "nodes",
  type: "number",
};

function getDatasetWithNodeData() {
  const dataset = getEmptyGraphDataset();
  dataset.nodeFields = [labelField];
  dataset.nodeData = {
    n1: { label: "Node 1" },
    n2: { label: "Node 2" },
  };
  return dataset;
}

describe("field model producers", () => {
  it("sets a field model and optional values", () => {
    const dataset = getDatasetWithNodeData();
    const nextDataset = setFieldModel(scoreField, { n1: 10, n2: 0 })(dataset);

    expect(nextDataset.nodeFields).toEqual([labelField, scoreField]);
    expect(nextDataset.nodeData.n1.score).toBe(10);
    expect(nextDataset.nodeData.n2.score).toBe(0);
  });

  it("moves a field model by offset", () => {
    const dataset = getDatasetWithNodeData();
    dataset.nodeFields = [labelField, scoreField];

    const nextDataset = moveFieldModel("nodes", "score", -1)(dataset);

    expect(nextDataset.nodeFields.map((field) => field.id)).toEqual(["score", "label"]);
  });

  it("creates a field model at the requested index", () => {
    const dataset = getDatasetWithNodeData();
    const nextDataset = createFieldModel(scoreField, { index: 0, values: { n1: 10, n2: 20 } })(dataset);

    expect(nextDataset.nodeFields).toEqual([scoreField, labelField]);
    expect(nextDataset.nodeData.n1.score).toBe(10);
    expect(nextDataset.nodeData.n2.score).toBe(20);
  });

  it("deletes a field model and removes values from node data", () => {
    const dataset = getDatasetWithNodeData();
    dataset.nodeFields = [labelField, scoreField];
    dataset.nodeData.n1.score = 10;
    dataset.nodeData.n2.score = 20;

    const nextDataset = deleteFieldModel(scoreField)(dataset);

    expect(nextDataset.nodeFields).toEqual([labelField]);
    expect(nextDataset.nodeData.n1).toEqual({ label: "Node 1" });
    expect(nextDataset.nodeData.n2).toEqual({ label: "Node 2" });
  });

  it("duplicates a field model and copies values", () => {
    const dataset = getDatasetWithNodeData();
    dataset.nodeFields = [labelField, scoreField];
    dataset.nodeData.n1.score = 10;
    dataset.nodeData.n2.score = 20;

    const nextDataset = duplicateFieldModel(scoreField)(dataset);

    expect(nextDataset.nodeFields.map((field) => field.id)).toEqual(["label", "score (1)", "score"]);
    expect(nextDataset.nodeData.n1["score (1)"]).toBe(10);
    expect(nextDataset.nodeData.n2["score (1)"]).toBe(20);
  });

  it("rejects duplicate field ids", () => {
    const dataset = getDatasetWithNodeData();
    dataset.nodeFields = [labelField, scoreField];

    expect(() => duplicateFieldModel(scoreField, "label")(dataset)).toThrow(
      'A nodes field model with id "label" already exists',
    );
  });
});
