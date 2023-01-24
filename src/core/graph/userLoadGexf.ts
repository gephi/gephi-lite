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

  const parseAndLoadGexf = useCallback(
    (xml: string) => {
      const graph = parse(Graph, xml);
      setGraphDataset(initializeGraphDataset(graph));
    },
    [setGraphDataset],
  );

  const loadFromUrl = useCallback(
    async (url: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(url);
        const gexf = await response.text();
        parseAndLoadGexf(gexf);
      } catch (e) {
        setError(e as Error);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [parseAndLoadGexf],
  );

  const loadFromData = useCallback(
    async (data: string) => {
      setLoading(true);
      setError(null);
      try {
        parseAndLoadGexf(data);
      } catch (e) {
        setError(e as Error);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [parseAndLoadGexf],
  );

  const loadFromFile = useCallback(
    async (file: File) => {
      setLoading(true);
      setError(null);
      try {
        const content = await file.text();
        parseAndLoadGexf(content);
      } catch (e) {
        setError(e as Error);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [parseAndLoadGexf],
  );

  return { loading, error, loadFromUrl, loadFromData, loadFromFile };
}
