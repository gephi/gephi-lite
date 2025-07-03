import { FC, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useFile, useFileActions } from "../../../core/context/dataContexts";
import { ModalProps } from "../../../core/modals/types";
import { useNotifications } from "../../../core/notifications";
import type { AsyncStatus } from "../../../utils/promises";
import { DropInput } from "../../DropInput";
import { Loader } from "../../Loader";
import { Modal } from "../../modals";

interface OpenLocalFileFormProps {
  id?: string;
  onStatusChange: (status: AsyncStatus) => void;
}
export const OpenLocalFileForm: FC<OpenLocalFileFormProps> = ({ id, onStatusChange }) => {
  const { t } = useTranslation();
  const { open } = useFileActions();
  const { notify } = useNotifications();
  const [file, setFile] = useState<File | null>(null);
  const {
    status: { type: importStateType },
  } = useFile();

  const onSubmit = useCallback(
    async (file: File) => {
      onStatusChange({ type: "loading" });
      try {
        await open({
          type: "local",
          filename: file.name,
          updatedAt: new Date(file.lastModified),
          size: file.size,
          source: file,
        });
        onStatusChange({ type: "success" });
        notify({
          type: "success",
          message: t("graph.open.local.success", { filename: file.name }).toString(),
        });
      } catch (e) {
        onStatusChange({ type: "error" });
        console.error(e);
        notify({
          type: "error",
          message: t("graph.open.local.error"),
          title: t("gephi-lite.title"),
        });
      }
    },
    [open, notify, t, onStatusChange],
  );

  return (
    <form
      id={id}
      onSubmit={(e) => {
        e.preventDefault();
        if (file) onSubmit(file);
      }}
    >
      {importStateType === "error" && (
        <p className="text-center text-danger">{t("graph.open.local.error").toString()}</p>
      )}
      <DropInput
        value={file}
        onChange={(file) => setFile(file)}
        helpText={t("graph.open.local.dragndrop_text").toString()}
        accept={{ "application/graph": [".gexf", ".graphml"], "application/json": [".json"] }}
      />
      {importStateType === "loading" && <Loader />}
    </form>
  );
};

export const OpenLocalFileModal: FC<ModalProps<unknown>> = ({ cancel }) => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<AsyncStatus>({ type: "idle" });

  useEffect(() => {
    // closing the modal on success
    if (status.type === "success") cancel();
  }, [status, cancel]);

  return (
    <Modal title={t("graph.open.local.title").toString()}>
      <OpenLocalFileForm id={"localFileForm"} onStatusChange={(s) => setStatus(s)} />
      <div className="gl-gap-2 d-flex">
        <button title={t("common.cancel").toString()} className="gl-btn gl-btn-outline" onClick={() => cancel()}>
          {t("common.cancel").toString()}
        </button>
        <button className="gl-btn gl-btn-fill" form="localFileForm" disabled={status.type === "loading"}>
          {t("common.open").toString()}
        </button>
      </div>
    </Modal>
  );
};
