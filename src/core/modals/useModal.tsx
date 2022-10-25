import { useCallback } from "react";

import { useAppContext } from "../../hooks/useAppContext";
import { ModalRequest } from "./types";

export function useModal() {
  const [{ modal }, setContext] = useAppContext();

  const openModal = useCallback(
    <ArgumentsType = unknown, SubmitArgumentsType = unknown>(
      request: ModalRequest<ArgumentsType, SubmitArgumentsType>,
    ) => {
      setContext((prev) => ({ ...prev, modal: request }));
    },
    [setContext],
  );

  const closeModal = useCallback(() => {
    setContext((prev) => ({ ...prev, modal: undefined }));
  }, [setContext]);

  return {
    modal,
    openModal,
    closeModal,
  };
}
