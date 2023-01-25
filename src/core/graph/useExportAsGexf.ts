import { useCallback, useState } from "react";
import { write } from "graphology-gexf";
import { toPairs } from "lodash";

import { useReadAtom } from "../utils/atoms";
import { graphDatasetAtom, sigmaGraphAtom } from "../graph";

export function useExportAsGexf() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const graphDataset = useReadAtom(graphDatasetAtom);
  const sigmaGraph = useReadAtom(sigmaGraphAtom);

  const exportAsGexf = useCallback(() => {
    try {
      setLoading(true);
      setError(null);
      // We take the sigma instance, so it already has all the graph structure
      // plus what is needed to render it
      const graphToExport = sigmaGraph.copy();

      // We add metadata
      graphToExport.updateAttributes((attr) => ({
        ...attr,
        ...graphDataset.metadata,
      }));

      // We add node properties
      toPairs(graphDataset.nodeData).forEach(([key, value]) => {
        if (graphToExport.hasNode(key)) {
          graphToExport.updateNodeAttributes(key, (attr) => ({ ...attr, ...value }));
        }
      });

      // We add edge properties
      toPairs(graphDataset.edgeData).forEach(([key, value]) => {
        if (graphToExport.hasEdge(key)) {
          graphToExport.updateEdgeAttributes(key, (attr) => ({ ...attr, ...value }));
        }
      });

      return write(graphToExport, {});
    } catch (e) {
      setError(e as Error);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [graphDataset, sigmaGraph]);

  return { loading, error, exportAsGexf };
}
