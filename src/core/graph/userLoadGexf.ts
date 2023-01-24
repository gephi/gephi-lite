import { useCallback, useState } from "react";
import { parse } from "graphology-gexf";
import Graph from "graphology";

import { useWriteAtom } from "../utils/atoms";
import { initializeGraphDataset } from "../graph/utils";
import { graphDatasetAtom } from "../graph";

export function useLoadGexf() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const setGraphDataset = useWriteAtom(graphDatasetAtom);

  const fetchUrl = useCallback(
    async (url: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(url);
        const gexf = await response.text();
        const graph = parse(Graph, gexf);
        setGraphDataset(initializeGraphDataset(graph));
      } catch (e) {
        setError(e as Error);
      } finally {
        setLoading(false);
      }
    },
    [setGraphDataset],
  );

  const load = useCallback(
    async (data: string) => {
      setLoading(true);
      setError(null);
      try {
        const graph = parse(Graph, data);
        setGraphDataset(initializeGraphDataset(graph));
      } catch (e) {
        setError(e as Error);
      } finally {
        setLoading(false);
      }
    },
    [setGraphDataset],
  );

  return { loading, error, fetch: fetchUrl, load };
}
