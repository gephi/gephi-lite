import { useCallback, useState } from "react";
import { write } from "graphology-gexf";

import { useReadAtom } from "../utils/atoms";
import { graphDatasetAtom } from "../graph";

export function useExportGexf() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const graphDataset = useReadAtom(graphDatasetAtom);

  const exportAsGexf = useCallback(() => {
    try {
      setLoading(true);
      setError(null);
      // TODO: change that with something that is a real export of the graph dataset
      return write(graphDataset.fullGraph, {});
    } catch (e) {
      setError(e as Error);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [graphDataset]);

  return { loading, error, exportAsGexf };
}
