import { isNil } from "lodash";
import { useCallback, useState } from "react";

import { useFile, useFileActions } from "../context/dataContexts";
import { useConnectedUser } from "../user";
import { CloudFile } from "./types";

// TODO: need to be refacto by atom/action/producer pattern
export function useCloudProvider() {
  const [user] = useConnectedUser();
  const { current: currentFile } = useFile();
  const { open, exportAsGephiLite, setCurrentFile } = useFileActions();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const getFiles = useCallback(
    async (skip: number, limit: number) => {
      setLoading(true);
      setError(null);
      try {
        if (isNil(user)) throw new Error("You must be logged !");
        return await user.provider.getFiles(skip, limit);
      } catch (e) {
        setError(e as Error);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [user],
  );

  const openFile = useCallback(
    async (file: Omit<CloudFile, "format">) => {
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

  const saveFile = useCallback(async (thumbnail?: Blob) => {
    setLoading(true);
    setError(null);
    try {
      if (isNil(user)) throw new Error("You must be logged !");
      if (!currentFile || currentFile.type !== "cloud") throw new Error("Not a cloud graph");
      if (thumbnail) console.log("[useCloudProvider] saveFile called with thumbnail");
      else console.log("[useCloudProvider] saveFile called WITHOUT thumbnail");

      await exportAsGephiLite(async (content) => {
        const result = await user.provider.saveFile(currentFile as CloudFile, content, thumbnail);
        setCurrentFile(result);
      });
    } catch (e) {
      setError(e as Error);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [user, exportAsGephiLite, currentFile, setCurrentFile]);

  /**
   * Save the current graph in the provider.
   */
  const createFile = useCallback(
    async (file: Pick<CloudFile, "filename" | "description" | "isPublic" | "format">, content: string, thumbnail?: Blob) => {
      setLoading(true);
      setError(null);
      try {
        if (isNil(user)) throw new Error("You must be logged !");

        if (thumbnail) console.log("[useCloudProvider] createFile called with thumbnail");
        else console.log("[useCloudProvider] createFile called WITHOUT thumbnail");

        const result = await user.provider.createFile(file, content, thumbnail);
        setCurrentFile(result);
      } catch (e) {
        setError(e as Error);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [user, setCurrentFile],
  );

  return { loading, error, getFiles, openFile, saveFile, createFile };
}
