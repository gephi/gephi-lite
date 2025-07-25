import Graph from "graphology";
import louvain from "graphology-communities-louvain/experimental/robust-randomness";
import { keyBy, mapValues, mean, zipObject } from "lodash";
import { FC, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { getPalette } from "../../../components/GraphAppearance/color/utils";
import { AppearanceState } from "../../appearance/types";
import { DEFAULT_NODE_COLOR } from "../../appearance/utils";
import { openInNewTab } from "../../broadcast/utils";
import { useAppearance, useFilters, useGraphDataset } from "../../context/dataContexts";
import { FullGraph } from "../../graph/types";
import { uniqFieldValuesAsStrings } from "../../graph/utils";
import { Metric } from "../types";

function computeLouvainEdgeScores(
  graph: Graph,
  {
    runs,
    getEdgeWeight,
    resolution,
  }: {
    runs: number;
    getEdgeWeight?: string;
    resolution: number;
  },
) {
  const edgeScores: { [edge: string]: number } = {};

  // Init:
  graph.forEachEdge((e, _) => {
    edgeScores[e] = 0;
  });

  // Accumulate co-membership occurrences:
  for (let i = 0; i < runs; i++) {
    const communities = louvain(graph, {
      resolution,
      getEdgeWeight: getEdgeWeight || null,
    });
    graph.forEachEdge((e, _, source, target) => {
      if (communities[source] === communities[target]) edgeScores[e]++;
    });
  }

  const coMembershipEdgeScores = mapValues(edgeScores, (v) => v / runs);
  const bridgeNessEdgeScores = mapValues(coMembershipEdgeScores, (v) => 1 - v);
  const ambiguityEdgeScores = mapValues(coMembershipEdgeScores, (v) => v * (1 - v) * 4);
  const nodes = graph.nodes();
  const meanAmbiguityNodeScores = zipObject(
    nodes,
    nodes.map((n) => mean(graph.mapEdges(n, (e) => ambiguityEdgeScores[e]))),
  );

  return {
    coMembershipEdgeScores,
    bridgeNessEdgeScores,
    ambiguityEdgeScores,
    meanAmbiguityNodeScores,
  };
}

const VisualizeAmbiguityForm: FC<{
  attributeNames: Record<string, string>;
}> = ({ attributeNames }) => {
  const { t } = useTranslation();
  const appearance = useAppearance();
  const dataset = useGraphDataset();
  const filters = useFilters();
  const isDisabled = useMemo(() => {
    const nodeFields = keyBy(dataset.nodeFields, "id");
    const edgeFields = keyBy(dataset.edgeFields, "id");

    return (
      !nodeFields[attributeNames["meanAmbiguityScore"]] ||
      !edgeFields[attributeNames["coMembershipScore"]] ||
      !edgeFields[attributeNames["ambiguityScore"]] ||
      !edgeFields[attributeNames["sourceCommunityId"]]
    );
  }, [attributeNames, dataset.edgeFields, dataset.nodeFields]);
  const getPreviewAppearance = useCallback(() => {
    const itemsData = dataset.edgeData;
    const values = uniqFieldValuesAsStrings(itemsData, attributeNames["sourceCommunityId"]);
    const newAppearance: AppearanceState = {
      ...appearance,
      nodesColor: {
        type: "fixed",
        value: "#ffffff",
      },
      nodesSize: {
        type: "ranking",
        field: { id: attributeNames["meanAmbiguityScore"], type: "number", itemType: "nodes" },
        minSize: 2,
        maxSize: 15,
        missingSize: 2,
      },
      nodesLabel: {
        type: "none",
      },
      edgesColor: {
        type: "partition",
        field: { id: attributeNames["sourceCommunityId"], type: "category", itemType: "edges" },
        colorPalette: { ...getPalette(values), bridge: "#000000" },
        missingColor: DEFAULT_NODE_COLOR,
      },
      edgesShadingColor: {
        type: "shading",
        field: { id: attributeNames["ambiguityScore"], type: "number", itemType: "edges" },
        factor: 1,
        targetColor: "#ffffff",
      },
      edgesSize: {
        type: "ranking",
        field: { id: attributeNames["ambiguityScore"], type: "number", itemType: "edges" },
        minSize: 1,
        maxSize: 5,
        missingSize: 2,
      },
      edgesZIndex: {
        type: "field",
        field: { id: attributeNames["ambiguityScore"], type: "number", itemType: "edges" },
        reversed: false,
      },
      backgroundColor: "#666666",
    };
    return newAppearance;
  }, [appearance, attributeNames, dataset.edgeData]);

  return (
    <div className="panel-block">
      <p className="gl-text-muted">{t("metrics.mixed.louvainEdgeAmbiguity.preview_description")}</p>
      <button
        type="button"
        className="gl-btn gl-btn-outline w-100 flex-column"
        onClick={() =>
          openInNewTab({
            dataset,
            filters,
            appearance: getPreviewAppearance(),
          })
        }
        disabled={isDisabled}
      >
        {t("metrics.mixed.louvainEdgeAmbiguity.preview")}
        <div className="small">{t("metrics.mixed.louvainEdgeAmbiguity.preview_subtitle")}</div>
      </button>
    </div>
  );
};

export const louvainEdgeAmbiguity: Metric<{
  edges: ["coMembershipScore", "bridgeNessEdgeScore", "ambiguityScore", "sourceCommunityId"];
  nodes: ["meanAmbiguityScore"];
}> = {
  id: "louvainEdgeAmbiguity",
  description: true,
  outputs: {
    edges: {
      coMembershipScore: { type: "number" },
      ambiguityScore: { type: "number" },
      sourceCommunityId: { type: "number" },
      bridgeNessEdgeScore: { type: "number" },
    },
    nodes: { meanAmbiguityScore: { type: "number" } },
  },
  parameters: [
    {
      id: "runs",
      type: "number",
      defaultValue: 50,
    },
    {
      id: "getEdgeWeight",
      type: "attribute",
      itemType: "edges",
      restriction: ["number"],
    },
    {
      id: "resolution",
      type: "number",
      defaultValue: 1,
    },
  ],
  fn(
    parameters: {
      runs: number;
      getEdgeWeight?: string;
      resolution: number;
    },
    graph: FullGraph,
  ) {
    const { coMembershipEdgeScores, bridgeNessEdgeScores, ambiguityEdgeScores, meanAmbiguityNodeScores } =
      computeLouvainEdgeScores(graph, parameters);

    // Run Louvain once more, with the same setup, to get some community classes (for coloring, basically):
    const communities = louvain(graph, {
      resolution: parameters.resolution,
      getEdgeWeight: parameters.getEdgeWeight || null,
    });
    const edgeCommunities: Record<string, string> = {};
    graph.forEachEdge((edge, _, source) => {
      const coMembership = coMembershipEdgeScores[edge];
      edgeCommunities[edge] = coMembership > 0.5 ? communities[source] + "" : "bridge";
    });

    return {
      edges: {
        coMembershipScore: coMembershipEdgeScores,
        bridgeNessEdgeScore: bridgeNessEdgeScores,
        ambiguityScore: ambiguityEdgeScores,
        sourceCommunityId: edgeCommunities,
      },
      nodes: {
        meanAmbiguityScore: meanAmbiguityNodeScores,
      },
    };
  },
  additionalControl: VisualizeAmbiguityForm,
};
