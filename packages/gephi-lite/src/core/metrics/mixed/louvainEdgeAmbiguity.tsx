import Graph from "graphology";
import louvain from "graphology-communities-louvain/experimental/robust-randomness";
import { mapValues, mean, zipObject } from "lodash";
import { FC, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { getPalette } from "../../../components/GraphAppearance/color/utils";
import { AppearanceState } from "../../appearance/types";
import { DEFAULT_NODE_COLOR } from "../../appearance/utils";
import { useAppearance, useAppearanceActions } from "../../context/dataContexts";
import { graphDatasetAtom } from "../../graph";
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
  const { setFullState } = useAppearanceActions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initialAppearance = useMemo(() => appearance, []);
  const previewAppearance = useMemo<AppearanceState>(() => {
    const itemsData = graphDatasetAtom.get().nodeData;
    const values = uniqFieldvaluesAsStrings(itemsData, attributeNames["modularityClass"]);
    const newAppearance: AppearanceState = {
      ...initialAppearance,
      nodesColor: {
        type: "partition",
        field: { field: attributeNames["modularityClass"] },
        colorPalette: getPalette(values),
        missingColor: DEFAULT_NODE_COLOR,
      },
      edgesColor: {
        type: "source",
      },
      edgesRefinementColor: {
        type: "refinement",
        field: { field: attributeNames["ambiguityScore"] },
        factor: 1,
        targetColor: "#ffffff",
      },
      edgesZIndex: {
        type: "field",
        field: { field: attributeNames["coMembershipScore"] },
        reversed: false,
      },
      backgroundColor: "#000000",
    };
    return newAppearance;
  }, [attributeNames, initialAppearance]);
  const [preview, setPreview] = useState(false);
  const preserveRef = useRef(false);

  // Swap appearance on preview update:
  useEffect(() => {
    setFullState(preview ? previewAppearance : initialAppearance);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview]);

  // Restore initial appearance before unmounting:
  useEffect(() => {
    return () => {
      if (!preserveRef.current) setFullState(initialAppearance);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <hr />

      <h6 className="m-0 d-flex align-items-center">{t("statistics.mixed.louvainEdgeAmbiguity.preview")}</h6>
      <p className="text-muted small">{t("statistics.mixed.louvainEdgeAmbiguity.preview_description")}</p>
      <button type="button" className="btn btn-dark w-100" onClick={() => setPreview((v) => !v)}>
        {preview
          ? t("statistics.mixed.louvainEdgeAmbiguity.deactivate_preview")
          : t("statistics.mixed.louvainEdgeAmbiguity.activate_preview")}
      </button>
      <div className="form-check mt-2">
        <input
          className="form-check-input"
          type="checkbox"
          onChange={(e) => {
            preserveRef.current = e.target.checked;
          }}
          id="louvainEdgeAmbiguity-preservePreviewState"
        />
        <label className="form-check-label" htmlFor="louvainEdgeAmbiguity-preservePreviewState">
          {t("statistics.mixed.louvainEdgeAmbiguity.preserve_preview")}
        </label>
      </div>
    </>
  );
};

const VisualizeAmbiguityFormWrapper: FC<{
  submitCount: number;
  attributeNames: Record<string, unknown>;
}> = ({ submitCount, attributeNames }) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fixedAttributeNames = useMemo(() => attributeNames as Record<string, string>, [submitCount]);

  if (!submitCount) return null;

  return <VisualizeAmbiguityForm attributeNames={fixedAttributeNames} />;
};

export const louvainEdgeAmbiguity: Metric<{
  edges: ["coMembershipScore", "ambiguityScore"];
  nodes: ["meanAmbiguityScore", "modularityClass"];
}> = {
  id: "louvainEdgeAmbiguity",
  description: true,
  outputs: {
    edges: { coMembershipScore: quantitativeOnly, ambiguityScore: quantitativeOnly },
    nodes: { modularityClass: qualitativeOnly, meanAmbiguityScore: quantitativeOnly },
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

    return {
      edges: {
        coMembershipScore: coMembershipEdgeScores,
        ambiguityScore: ambiguityEdgeScores,
      },
      nodes: {
        meanAmbiguityScore: meanAmbiguityNodeScores,
        modularityClass: communities,
      },
    };
  },
  additionalControl: VisualizeAmbiguityFormWrapper,
};
