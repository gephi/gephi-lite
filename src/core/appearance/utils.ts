import chroma from "chroma-js";
import { forEach } from "lodash";

import { AppearanceState, EdgeColor } from "./types";
import { EdgeDisplayData, NodeDisplayData } from "sigma/types";
import { GraphDataset, ItemData } from "../graph/types";
import { toNumber } from "../utils/casting";
import Sigma from "sigma";

export const DEFAULT_NODE_COLOR = "#999999";
export const DEFAULT_EDGE_COLOR = "#cccccc";
export const DEFAULT_NODE_SIZE = 6;
export const DEFAULT_EDGE_SIZE = 1;

export function getEmptyAppearanceState(): AppearanceState {
  return {
    nodesSize: {
      type: "data",
    },
    edgesSize: {
      type: "data",
    },
    nodesColor: {
      type: "data",
    },
    edgesColor: {
      type: "data",
    },
  };
}

export function getReducer<
  T extends { itemType: "nodes"; displayData: NodeDisplayData } | { itemType: "edges"; displayData: EdgeDisplayData },
>(
  itemType: T["itemType"],
  sigma: Sigma,
  { nodeData, edgeData, fullGraph }: GraphDataset,
  { nodesSize, nodesColor, edgesSize, edgesColor }: AppearanceState,
): (itemId: string, data: ItemData) => Partial<T["displayData"]> {
  const colorsDef = itemType === "nodes" ? nodesColor : edgesColor;
  const sizesDef = itemType === "nodes" ? nodesSize : edgesSize;
  const itemsValues = itemType === "nodes" ? nodeData : edgeData;

  // Handle colors:
  let getColor: ((itemId: string, data: ItemData) => string) | null = null;
  switch (colorsDef.type) {
    case "partition":
      getColor = (_itemId: string, data: ItemData) => {
        const value = data[colorsDef.field] as string;
        return value in colorsDef.colorPalette ? colorsDef.colorPalette[value] : colorsDef.missingColor;
      };
      break;
    case "ranking": {
      let min = Infinity,
        max = -Infinity;
      forEach(itemsValues, (data) => {
        const value = toNumber(data[colorsDef.field]);
        if (typeof value === "number") {
          min = Math.min(min, value);
          max = Math.max(max, value);
        }
      });
      const delta = max - min;
      // TODO: Handle irregular domains
      const colorScale = chroma.scale(colorsDef.colorScalePoints.map((point) => point.color));
      getColor = (_itemId: string, data: ItemData) => {
        const value = toNumber(data[colorsDef.field]);
        if (typeof value === "number") {
          return colorScale((value - min) / delta).hex();
        }
        return colorsDef.missingColor;
      };
      break;
    }
    case "fixed":
      getColor = () => colorsDef.value;
  }

  if (itemType === "edges") {
    switch ((colorsDef as EdgeColor).type) {
      case "source":
        getColor = (edgeId: string) => {
          return sigma.getNodeDisplayData(fullGraph.source(edgeId))!.color;
        };
        break;
      case "target":
        getColor = (edgeId: string) => {
          return sigma.getNodeDisplayData(fullGraph.target(edgeId))!.color;
        };
        break;
    }
  }

  // Handle sizes:
  let getSize: ((itemId: string, data: ItemData) => number) | null = null;
  switch (sizesDef.type) {
    case "ranking": {
      let min = Infinity,
        max = -Infinity;
      forEach(itemsValues, (data) => {
        const value = toNumber(data[sizesDef.field]);
        if (typeof value === "number") {
          min = Math.min(min, value);
          max = Math.max(max, value);
        }
      });
      const ratio = (sizesDef.maxSize - sizesDef.minSize) / (max - min);
      getSize = (_itemId: string, data: ItemData) => {
        const value = toNumber(data[sizesDef.field]);
        if (typeof value === "number") {
          // TODO: Handle transformation method
          return (value - min) * ratio + sizesDef.minSize;
        }
        return sizesDef.missingSize;
      };
      break;
    }
    case "fixed":
      getSize = () => sizesDef.value;
  }

  return (itemId: string, displayData: ItemData) => {
    const data = itemsValues[itemId];
    const res = { ...displayData } as Partial<NodeDisplayData>;

    if (getColor) res.color = getColor(itemId, data);
    if (getSize) res.size = getSize(itemId, data);

    return res;
  };
}
