import { useCallback, useState } from "react";
import { parse } from "graphology-gexf";
import Graph from "graphology";

import { useWriteAtom } from "../utils/atoms";
import { initializeGraphDataset } from "../graph/utils";
import { graphDatasetAtom } from "../graph";

export function useImportGexf() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const setGraphDataset = useWriteAtom(graphDatasetAtom);

  const importGexf = useCallback(
    (xml: string) => {
      const graph = parse(Graph, xml);
      setGraphDataset(initializeGraphDataset(graph));
    },
    [setGraphDataset],
  );

  const importFromUrl = useCallback(
    async (url: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(url);
        const gexf = await response.text();
        importGexf(gexf);
      } catch (e) {
        setError(e as Error);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [importGexf],
  );

  const importFromContent = useCallback(
    async (data: string) => {
      setLoading(true);
      setError(null);
      try {
        importGexf(data);
      } catch (e) {
        setError(e as Error);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [importGexf],
  );

  const importFromFile = useCallback(
    async (file: File) => {
      setLoading(true);
      setError(null);
      try {
        const content = await file.text();
        importGexf(content);
      } catch (e) {
        setError(e as Error);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [importGexf],
  );

  return { loading, error, importFromUrl, importFromContent, importFromFile };
}
