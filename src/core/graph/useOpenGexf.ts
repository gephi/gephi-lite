import { useCallback, useState } from "react";
import { parse } from "graphology-gexf";
import Graph from "graphology";

import { RemoteFile, LocalFile } from "./types";
import { initializeGraphDataset } from "./utils";
import { useGraphDatasetActions, usePreferencesActions, useResetStates } from "../context/dataContexts";
import { resetCamera } from "../sigma";

export function useOpenGexf() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const { setGraphDataset } = useGraphDatasetActions();
  const resetStates = useResetStates();
  const { addRemoteFile } = usePreferencesActions();

  const openRemoteFile = useCallback(
    async (remote: RemoteFile) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(remote.url);
        const gexf = await response.text();
        const graph = parse(Graph, gexf);
        resetStates();
        setGraphDataset({ ...initializeGraphDataset(graph), origin: remote });
        addRemoteFile(remote);
        resetCamera({ forceRefresh: true });
      } catch (e) {
        setError(e as Error);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [addRemoteFile, resetStates, setGraphDataset],
  );

  const openLocalFile = useCallback(
    async (file: LocalFile) => {
      setLoading(true);
      setError(null);
      try {
        const content = await file.source.text();
        const graph = parse(Graph, content);
        setGraphDataset({ ...initializeGraphDataset(graph), origin: file });
        resetStates();
        resetCamera({ forceRefresh: true });
      } catch (e) {
        setError(e as Error);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [resetStates, setGraphDataset],
  );

  return { loading, error, openRemoteFile, openLocalFile };
}
