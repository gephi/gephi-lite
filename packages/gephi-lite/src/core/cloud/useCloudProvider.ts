import { isNil } from "lodash";
import { useCallback, useState } from "react";

import { useFile, useFileActions } from "../context/dataContexts";
import { useConnectedUser } from "../user";
import { CloudFile } from "./types";

// TODO: need to be refacto by atom/action/producer pattern
export function useCloudProvider() {
  const [user] = useConnectedUser();
  const { current: currentFile } = useFile();
  const { open, exportAsGexf, setCurrentFile } = useFileActions();

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
        throw e;
      } finally {
        setLoading(false);
      }
      return result;
    },
    [user],
  );

  const openFile = useCallback(
    async (file: CloudFile) => {
      setLoading(true);
      setError(null);
      try {
        await open(file);
      } catch (e) {
        setError(e as Error);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [open],
  );

  /**
   * Save the current graph in the provider.
   */
  const saveFile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isNil(user)) throw new Error("You must be logged !");
      if (!currentFile || currentFile.type !== "cloud") throw new Error("Not a cloud graph");
      await exportAsGexf(async (content) => {
        await user.provider.saveFile(currentFile as CloudFile, content);
      });
    } catch (e) {
      setError(e as Error);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [user, exportAsGexf, currentFile]);

  /**
   * Save the current graph in the provider.
   */
  const createFile = useCallback(
    async (file: Pick<CloudFile, "filename" | "description" | "isPublic">) => {
      setLoading(true);
      setError(null);
      try {
        if (isNil(user)) throw new Error("You must be logged !");
        await exportAsGexf(async (content) => {
          const result = await user.provider.createFile(file, content);
          setCurrentFile(result);
        });
      } catch (e) {
        setError(e as Error);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [user, exportAsGexf, setCurrentFile],
  );

  return { loading, error, getFiles, openFile, saveFile, createFile };
}
