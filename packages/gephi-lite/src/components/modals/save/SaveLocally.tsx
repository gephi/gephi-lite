import FileSaver from "file-saver";
import { FC, useCallback } from "react";
import { useTranslation } from "react-i18next";

import { useFile, useFileActions } from "../../../core/context/dataContexts";
import { getFilename } from "../../../core/file/utils";
import { useNotifications } from "../../../core/notifications";
import type { AsyncStatus } from "../../../utils/promises";
import { DownloadIcon } from "../../common-icons";

interface SaveCLocallyProps {
  id?: string;
  onStatusChange: (status: AsyncStatus) => void;
}
export const SaveLocally: FC<SaveCLocallyProps> = ({ id, onStatusChange }) => {
  const { current } = useFile();
  const { t } = useTranslation();
  const { notify } = useNotifications();
  const { exportAsGephiLite } = useFileActions();

  const download = useCallback(async () => {
    try {
      onStatusChange({ type: "loading" });
      await exportAsGephiLite((content) => {
        FileSaver(new Blob([content]), getFilename(current?.filename || "gephi-lite", "gephi-lite"));
      });
      onStatusChange({ type: "success" });
      notify({
        type: "success",
        message: t("graph.save.local.success").toString(),
      });
    } catch (e) {
      console.error(e);
      onStatusChange({ type: "error" });
      notify({ type: "error", message: t("graph.save.local.error").toString() });
    }
  }, [current?.filename, onStatusChange, exportAsGephiLite, notify, t]);

  return (
    <div
      id={id}
      className="h-100 d-flex flex-column align-items-center justify-content-center justify-content-center align-items-center"
    >
      <p>{t("graph.save.local.description")}</p>
      <button className="gl-btn gl-btn-outline " onClick={download}>
        <DownloadIcon /> {t("common.download")}
      </button>
    </div>
  );
};
