import { atom, useAtom } from "@ouestware/atoms";
import { useCallback } from "react";

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
    setModalState((modalState) => ({ ...modalState, modal: undefined, hasUnsavedInput: false }));
  }, [setModalState]);

  // Declared by the open modal, so a close request coming from outside of it knows whether
  // anything would be lost.
  const setUnsavedInput = useCallback(
    (hasUnsavedInput: boolean) => {
      setModalState((modalState) =>
        !!modalState.hasUnsavedInput === hasUnsavedInput ? modalState : { ...modalState, hasUnsavedInput },
      );
    },
    [setModalState],
  );

  // Close asked for from outside the modal (the Android back button). A modal holding unsaved
  // input is asked to confirm instead of being closed outright; every other one closes as before.
  const requestCloseModal = useCallback(() => {
    setModalState((modalState) =>
      modalState.hasUnsavedInput
        ? { ...modalState, closeRequestId: (modalState.closeRequestId || 0) + 1 }
        : { ...modalState, modal: undefined, hasUnsavedInput: false },
    );
  }, [setModalState]);

  return {
    modal: modalState.modal,
    closeRequestId: modalState.closeRequestId,
    openModal,
    closeModal,
    requestCloseModal,
    setUnsavedInput,
  };
}
