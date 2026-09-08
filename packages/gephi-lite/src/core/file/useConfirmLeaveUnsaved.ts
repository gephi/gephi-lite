import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { useFile } from "../context/dataContexts";

/**
 * Opening another graph discards whatever is currently loaded: shared by every entry point that
 * can trigger that (Workspace > Open in the Header, the Welcome modal's local/GitHub tabs and
 * sample graphs...), so they all warn identically when there are unsaved changes instead of
 * drifting apart. Returns whether the caller should proceed.
 */
export function useConfirmLeaveUnsaved(): () => boolean {
  const { t } = useTranslation();
  const { isDirty } = useFile();

  return useCallback(() => !isDirty || window.confirm(t("workspace.confirm_leave_unsaved")), [isDirty, t]);
}
