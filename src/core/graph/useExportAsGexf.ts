import { useCallback, useState } from "react";
import { write } from "graphology-gexf";

import { useReadAtom } from "../utils/atoms";
import { graphDatasetAtom, sigmaAtom } from "./index";
import { getFullVisibleGraph } from "./utils";

export function useExportAsGexf() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const graphDataset = useReadAtom(graphDatasetAtom);
  const sigma = useReadAtom(sigmaAtom);

  /**
   * Export the current graph as a GEXF.
   */
  const exportAsGexf = useCallback(() => {
    try {
      setLoading(true);
      setError(null);
      // We take the sigma instance, so it already has all the graph structure
      // plus what is needed to render it
      const graphToExport = getFullVisibleGraph(graphDataset, sigma);

      return write(graphToExport, {});
    } catch (e) {
      setError(e as Error);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [graphDataset, sigma]);

  /**
   * Download the current graph as a GEXF file
   */
  const downloadAsGexf = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const content = await exportAsGexf();
      const data = new Blob([content]);
      // Create a new link
      const anchor = document.createElement("a");
      anchor.href = URL.createObjectURL(data);
      anchor.download = graphDataset.origin?.filename || "gephi-lite.gexf";
      // Append to the DOM
      document.body.appendChild(anchor);
      // Trigger `click` event
      anchor.click();
      // Remove element from DOM
      document.body.removeChild(anchor);
    } catch (e) {
      setError(e as Error);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [exportAsGexf, graphDataset]);

  return { loading, error, exportAsGexf, downloadAsGexf };
}
