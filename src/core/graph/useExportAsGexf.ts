import { useCallback, useState } from "react";
import { write } from "graphology-gexf";
import { toUndirected } from "graphology-operators";

import { dataGraphToFullGraph } from "./utils";
import { useFilteredGraph, useGraphDataset } from "../context/dataContexts";

export function useExportAsGexf() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const graphDataset = useGraphDataset();
  const filteredGraph = useFilteredGraph();

  /**
   * Export the current graph as a GEXF.
   */
  const exportAsGexf = useCallback(() => {
    try {
      setLoading(true);
      setError(null);
      // get the full graph
      let graphToExport = dataGraphToFullGraph(graphDataset, filteredGraph);

      // change the type of the graph based on the meta type (default is directed)
      if (graphDataset.metadata.type === "undirected") graphToExport = toUndirected(graphToExport);

      // finally, export as gexf
      return write(graphToExport, {});
    } catch (e) {
      setError(e as Error);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [filteredGraph, graphDataset]);

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
