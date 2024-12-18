import Graph from "graphology";
import louvain from "graphology-communities-louvain/experimental/robust-randomness";
import { mapValues, mean, zipObject } from "lodash";

import { FullGraph } from "../../graph/types";
import { Metric } from "../types";
import { quantitativeOnly } from "../utils";

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

export const louvainEdgeAmbiguity: Metric<{
  edges: ["coMembershipScore", "ambiguityScore"];
  nodes: ["meanAmbiguityScore"];
}> = {
  id: "louvainEdgeAmbiguity",
  description: true,
  outputs: {
    edges: { coMembershipScore: quantitativeOnly, ambiguityScore: quantitativeOnly },
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

    return {
      edges: {
        coMembershipScore: coMembershipEdgeScores,
        ambiguityScore: ambiguityEdgeScores,
      },
      nodes: {
        meanAmbiguityScore: meanAmbiguityNodeScores,
      },
    };
  },
};
