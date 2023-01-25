import { useCallback, useState } from "react";
import { parse } from "graphology-gexf";
import Graph from "graphology";

import { useWriteAtom } from "../utils/atoms";
import { RemoteFile, LocalFile } from "../graph/types";
import { initializeGraphDataset } from "../graph/utils";
import { graphDatasetAtom } from "../graph";

export function useOpenGexf() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const setGraphDataset = useWriteAtom(graphDatasetAtom);

  const openRemoteFile = useCallback(
    async (remote: RemoteFile) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(remote.url);
        const gexf = await response.text();
        const graph = parse(Graph, gexf);
        setGraphDataset({ ...initializeGraphDataset(graph), origin: remote });
      } catch (e) {
        setError(e as Error);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [setGraphDataset],
  );

  const openLocalFile = useCallback(
    async (file: LocalFile) => {
      setLoading(true);
      setError(null);
      try {
        const content = await file.text();
        const graph = parse(Graph, content);
        setGraphDataset({ ...initializeGraphDataset(graph), origin: file });
      } catch (e) {
        setError(e as Error);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [setGraphDataset],
  );

  return { loading, error, openRemoteFile, openLocalFile };
}
