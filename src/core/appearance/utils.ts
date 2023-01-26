import Sigma from "sigma";
import { Settings } from "sigma/settings";
import drawLabel from "sigma/rendering/canvas/label";
import drawHover from "sigma/rendering/canvas/hover";
import drawEdgeLabel from "sigma/rendering/canvas/edge-label";
import chroma from "chroma-js";
import { forEach } from "lodash";

import { AppearanceState, EdgeColor } from "./types";
import { EdgeDisplayData, NodeDisplayData } from "sigma/types";
import { GraphDataset, ItemData } from "../graph/types";
import { toNumber, toString } from "../utils/casting";

export const DEFAULT_NODE_COLOR = "#999999";
export const DEFAULT_EDGE_COLOR = "#cccccc";
export const DEFAULT_NODE_SIZE = 6;
export const DEFAULT_EDGE_SIZE = 1;
export const DEFAULT_NODE_LABEL_SIZE = 14;
export const DEFAULT_EDGE_LABEL_SIZE = 14;

export function getEmptyAppearanceState(): AppearanceState {
  return {
    showEdges: true,
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
    nodesLabel: {
      type: "data",
    },
    edgesLabel: {
      type: "data",
    },
    nodesLabelSize: {
      type: "fixed",
      value: DEFAULT_NODE_LABEL_SIZE,
    },
    edgesLabelSize: {
      type: "fixed",
      value: DEFAULT_EDGE_LABEL_SIZE,
    },
  };
}

export function getReducer<
  T extends { itemType: "nodes"; displayData: NodeDisplayData } | { itemType: "edges"; displayData: EdgeDisplayData },
>(
  itemType: T["itemType"],
  sigma: Sigma,
  { nodeData, edgeData, fullGraph }: GraphDataset,
  { showEdges, nodesSize, nodesColor, nodesLabel, edgesSize, edgesColor, edgesLabel }: AppearanceState,
): (itemId: string, data: ItemData) => Partial<T["displayData"]> & { rawSize?: number } {
  const colorsDef = itemType === "nodes" ? nodesColor : edgesColor;
  const sizesDef = itemType === "nodes" ? nodesSize : edgesSize;
  const labelsDef = itemType === "nodes" ? nodesLabel : edgesLabel;
  const itemsValues = itemType === "nodes" ? nodeData : edgeData;

  // Early exit for "showEdges: false":
  if (itemType === "edges" && !showEdges) return () => ({ hidden: true } as Partial<EdgeDisplayData>);

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
      const delta = max - min || 1;
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
      const delta = max - min || 1;
      const ratio = (sizesDef.maxSize - sizesDef.minSize) / delta;
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

  // Handle labels:
  let getLabel: ((itemId: string, data: ItemData) => string | null) | null = null;
  switch (labelsDef.type) {
    case "none":
      getLabel = () => null;
      break;
    case "fixed":
      getLabel = () => labelsDef.value;
      break;
    case "field":
      getLabel = (_itemId: string, data: ItemData) => {
        const label = toString(data[labelsDef.field]);
        return typeof label === "string" ? label : labelsDef.missingLabel;
      };
      break;
  }

  const defaultSize = itemType === "nodes" ? DEFAULT_NODE_SIZE : DEFAULT_EDGE_SIZE;
  return (itemId: string, displayData: ItemData) => {
    const data = itemsValues[itemId];
    const res = { ...displayData } as Partial<NodeDisplayData> & { rawSize?: number };

    if (getColor) res.color = getColor(itemId, data);
    if (getSize) res.size = getSize(itemId, data);
    if (getLabel) res.label = getLabel(itemId, data);
    res.rawSize = res.size || defaultSize;

    return res;
  };
}

export function getDrawLabel({ nodesLabelSize }: AppearanceState): typeof drawLabel {
  if (nodesLabelSize.type === "fixed") {
    return (context, data, settings) => drawLabel(context, data, { ...settings, labelSize: nodesLabelSize.value });
  } else {
    return (context, data, settings) =>
      drawLabel(context, data, {
        ...settings,
        labelSize: (nodesLabelSize.adaptsToZoom ? data.size : (data.rawSize as number)) * nodesLabelSize.coef,
      });
  }
}

export function getDrawHover({ nodesLabelSize }: AppearanceState): typeof drawHover {
  if (nodesLabelSize.type === "fixed") {
    return (context, data, settings) => drawHover(context, data, { ...settings, labelSize: nodesLabelSize.value });
  } else {
    return (context, data, settings) =>
      drawHover(context, data, {
        ...settings,
        labelSize: (nodesLabelSize.adaptsToZoom ? data.size : (data.rawSize as number)) * nodesLabelSize.coef,
      });
  }
}

export function getDrawEdgeLabel({ edgesLabelSize }: AppearanceState): typeof drawEdgeLabel {
  if (edgesLabelSize.type === "fixed") {
    return (context, data, sourceData, targetData, settings: Settings) =>
      drawEdgeLabel(context, data, sourceData, targetData, { ...settings, edgeLabelSize: edgesLabelSize.value });
  } else {
    return (context, data, sourceData, targetData, settings: Settings) =>
      drawEdgeLabel(context, data, sourceData, targetData, {
        ...settings,
        edgeLabelSize: (edgesLabelSize.adaptsToZoom ? data.size : (data.rawSize as number)) * edgesLabelSize.coef,
      });
  }
}
