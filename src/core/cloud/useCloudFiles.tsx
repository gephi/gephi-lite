import { useState, useCallback } from "react";
import { isNil } from "lodash";

import { useConnectedUser } from "../user/index";
import { CloudFile } from "./types";

export function useCloudFiles() {
  const [user] = useConnectedUser();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const getFiles = useCallback(
    async (skip: number, limit: number) => {
      setLoading(true);
      setError(null);
      let result: Array<CloudFile> = [];
      try {
        if (isNil(user)) throw new Error("You must be logged !");
        result = await user.provider.getFiles(skip, limit);
      } catch (e) {
        setError(e as Error);
      } finally {
        setLoading(false);
      }
      return result;
    },
    [user],
  );

  const getFile = useCallback(
    async (file: CloudFile) => {
      setLoading(true);
      setError(null);
      let result: string | null = null;
      try {
        if (isNil(user)) throw new Error("You must be logged !");
        result = await user.provider.getFileContent(file.id);
        if (!result) throw new Error(`File ${file.filename} not found or empty`);
      } catch (e) {
        setError(e as Error);
      } finally {
        setLoading(false);
      }
      return result;
    },
    [user],
  );

  return { loading, error, getFiles, getFile };
}
