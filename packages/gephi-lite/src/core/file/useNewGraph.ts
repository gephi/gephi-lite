import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import ConfirmModal from "../../components/modals/ConfirmModal";
import { resetStates } from "../context/dataContexts";
import { useModal } from "../modals";

/**
 * Starting a new, empty graph always discards whatever is currently loaded (the whole workspace -
 * filters, layout, appearance... - gets wiped, not just unsaved graph edits), so unlike opening
 * another file this always asks for confirmation, even with nothing dirty. Shared by every entry
 * point that can trigger it (Workspace > New in the Header, the Welcome modal's "new" button...),
 * so they confirm identically instead of drifting apart.
 */
export function useNewGraph(): (onConfirmed?: () => void) => void {
  const { t } = useTranslation();
  const { openModal } = useModal();

  return useCallback(
    (onConfirmed) =>
      openModal({
        component: ConfirmModal,
        arguments: {
          title: t(`graph.open.new.title`),
          message: t(`graph.open.new.message`),
          successMsg: t(`graph.open.new.success`),
        },
        // Reset the whole workspace, including the current file pointer: otherwise the save
        // button would keep targeting the previously opened GitHub file and overwrite it.
        beforeSubmit: () => resetStates(false),
        afterSubmit: onConfirmed,
      }),
    [openModal, t],
  );
}
