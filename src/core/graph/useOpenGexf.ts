import { useCallback, useState } from "react";
import { parse } from "graphology-gexf";
import Graph from "graphology";

import { useWriteAtom } from "../utils/atoms";
import { RemoteFile, LocalFile } from "../graph/types";
import { initializeGraphDataset } from "../graph/utils";
import { graphDatasetAtom } from "../graph";
import { usePreferencesActions } from "../context/dataContexts";
import { filtersAtom } from "../filters";
import { appearanceAtom } from "../appearance";
import { getEmptyFiltersState } from "../filters/utils";
import { getEmptyAppearanceState } from "../appearance/utils";

export function useOpenGexf() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const setGraphDataset = useWriteAtom(graphDatasetAtom);
  const setFilters = useWriteAtom(filtersAtom);
  const setAppearance = useWriteAtom(appearanceAtom);
  const { addRemoteFile } = usePreferencesActions();

  const openRemoteFile = useCallback(
    async (remote: RemoteFile) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(remote.url);
        const gexf = await response.text();
        const graph = parse(Graph, gexf);
        setGraphDataset({ ...initializeGraphDataset(graph), origin: remote });
        setFilters(getEmptyFiltersState());
        setAppearance(getEmptyAppearanceState());
        addRemoteFile(remote);
      } catch (e) {
        setError(e as Error);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [addRemoteFile, setAppearance, setFilters, setGraphDataset],
  );

  const openLocalFile = useCallback(
    async (file: LocalFile) => {
      setLoading(true);
      setError(null);
      try {
        const content = await file.source.text();
        const graph = parse(Graph, content);
        setGraphDataset({ ...initializeGraphDataset(graph), origin: file });
        setFilters(getEmptyFiltersState());
        setAppearance(getEmptyAppearanceState());
      } catch (e) {
        setError(e as Error);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [setAppearance, setFilters, setGraphDataset],
  );

  return { loading, error, openRemoteFile, openLocalFile };
}
