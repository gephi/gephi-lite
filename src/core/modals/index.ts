import { useCallback } from "react";

import { atom, useAtom } from "../utils/atoms";
import { ModalRequest, ModalState } from "./types";

export const modalStateAtom = atom<ModalState>({});

export function useModal() {
  const [modalState, setModalState] = useAtom(modalStateAtom);

  const openModal = useCallback(
    <ArgumentsType, SubmitArgumentsType>(request: ModalRequest<ArgumentsType, SubmitArgumentsType>) => {
      setModalState((modalState) => ({ ...modalState, modal: request }));
    },
    [setModalState],
  );

  const closeModal = useCallback(() => {
    setModalState((modalState) => ({ ...modalState, modal: undefined }));
  }, [setModalState]);

  return {
    modal: modalState.modal,
    openModal,
    closeModal,
  };
}
