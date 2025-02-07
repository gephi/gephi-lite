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
import { uniqFieldvaluesAsStrings } from "../../graph/utils";
import { Metric } from "../types";
import { qualitativeOnly, quantitativeOnly } from "../utils";

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
  const ambiguityEdgeScores = mapValues(edgeScores, (v) => v * (1 - v) * 4);
  const nodes = graph.nodes();
  const meanAmbiguityNodeScores = zipObject(
    nodes,
    nodes.map((n) => mean(graph.mapEdges(n, (e) => ambiguityEdgeScores[e]))),
  );

  return {
    coMembershipEdgeScores,
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
    const values = uniqFieldvaluesAsStrings(itemsData, attributeNames["sourceCommunityId"]);
    const newAppearance: AppearanceState = {
      ...appearance,
      nodesColor: {
        type: "fixed",
        value: "#ffffff",
      },
      nodesSize: {
        type: "ranking",
        field: { field: attributeNames["meanAmbiguityScore"] },
        minSize: 2,
        maxSize: 15,
        missingSize: 2,
      },
      edgesColor: {
        type: "partition",
        field: { field: attributeNames["sourceCommunityId"] },
        colorPalette: getPalette(values),
        missingColor: DEFAULT_NODE_COLOR,
      },
      edgesShadingColor: {
        type: "shading",
        field: { field: attributeNames["ambiguityScore"] },
        factor: 0.8,
        targetColor: "#ffffff",
      },
      edgesSize: {
        type: "fixed",
        value: 3,
      },
      edgesZIndex: {
        type: "field",
        field: { field: attributeNames["coMembershipScore"] },
        reversed: false,
      },
      backgroundColor: "#666666",
    };
    return newAppearance;
  }, [appearance, attributeNames, dataset.edgeData]);

  return (
    <>
      <hr />

      <h6 className="m-0 d-flex align-items-center">{}</h6>
      <p className="text-muted small">{t("statistics.mixed.louvainEdgeAmbiguity.preview_description")}</p>
      <button
        type="button"
        className="btn btn-dark w-100"
        onClick={() =>
          openInNewTab({
            dataset,
            filters,
            appearance: getPreviewAppearance(),
          })
        }
        disabled={isDisabled}
      >
        {t("statistics.mixed.louvainEdgeAmbiguity.preview")}
        <div className="small">{t("statistics.mixed.louvainEdgeAmbiguity.preview_subtitle")}</div>
      </button>
    </>
  );
};

export const louvainEdgeAmbiguity: Metric<{
  edges: ["coMembershipScore", "ambiguityScore", "sourceCommunityId"];
  nodes: ["meanAmbiguityScore"];
}> = {
  id: "louvainEdgeAmbiguity",
  description: true,
  outputs: {
    edges: {
      coMembershipScore: quantitativeOnly,
      ambiguityScore: quantitativeOnly,
      sourceCommunityId: qualitativeOnly,
    },
    nodes: { meanAmbiguityScore: quantitativeOnly },
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
      restriction: "quantitative",
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
      scoreType: "coMembership" | "ambiguity";
      getEdgeWeight?: string;
      fastLocalMoves: boolean;
      randomWalk: boolean;
      resolution: number;
    },
    graph: FullGraph,
  ) {
    const { coMembershipEdgeScores, ambiguityEdgeScores, meanAmbiguityNodeScores } = computeLouvainEdgeScores(
      graph,
      parameters,
    );

    // Run Louvain once more, with the same setup, to get some community classes (for coloring, basically):
    const communities = louvain(graph, {
      resolution: parameters.resolution,
      getEdgeWeight: parameters.getEdgeWeight || null,
    });
    const edgeCommunities: Record<string, number> = {};
    graph.forEachEdge((edge, _, source) => {
      edgeCommunities[edge] = communities[source];
    });

    return {
      edges: {
        coMembershipScore: coMembershipEdgeScores,
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
