import { FC, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { PiFolderOpen } from "react-icons/pi";

import { useFileActions } from "../../../core/context/dataContexts";
import { errorToCode, errorToString } from "../../../core/errors";
import { ModalProps } from "../../../core/modals/types";
import { useNotifications } from "../../../core/notifications";
import type { AsyncStatus } from "../../../utils/promises";
import { DropInput } from "../../DropInput";
import { Loader } from "../../Loader";
import { Modal } from "../../modals";

interface OpenLocalFileFormProps {
  id?: string;
  onStatusChange: (status: AsyncStatus) => void;
  status: AsyncStatus;
}
export const OpenLocalFileForm: FC<OpenLocalFileFormProps> = ({ id, onStatusChange, status }) => {
  const { t } = useTranslation();
  const { open } = useFileActions();
  const { notify } = useNotifications();
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (file === null) onStatusChange({ type: "idle" });
  }, [file, onStatusChange]);

  const onSubmit = useCallback(
    async (file: File, force = false) => {
      onStatusChange({ type: "loading" });
      try {
        await open(
          {
            type: "local",
            filename: file.name,
            updatedAt: new Date(file.lastModified),
            size: file.size,
            source: file,
          },
          { force },
        );
        onStatusChange({ type: "success" });
        notify({
          type: "success",
          message: t("graph.open.local.success", { filename: file.name }),
        });
      } catch (e) {
        onStatusChange({ type: "error", message: errorToString(e), code: errorToCode(e) });
        console.error(e);
      }
    },
    [open, notify, t, onStatusChange],
  );

  return (
    <form
      id={id}
      className="text-center h-100 d-flex align-items-center justify-content-center"
      onSubmit={(e) => {
        e.preventDefault();
        if (file) onSubmit(file);
      }}
    >
      <DropInput
        value={file}
        onChange={(file) => setFile(file)}
        helpText={t("graph.open.local.dragndrop_text")}
        accept={{ "application/graph": [".gexf", ".graphml"], "application/json": [".json"] }}
      >
        {status.type === "error" && (
          <div className="alert gl-m-0 gl-alert-error d-flex flex-column align-items-center mb-3">
            <p>{status.message || t("graph.open.local.error")}</p>
            {status.code === "IMPORT_BAD_VERSION" && (
              <button
                className="gl-btn gl-btn-fill"
                title={t("graph.open.force.description")}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (file) onSubmit(file, true);
                }}
              >
                {t("graph.open.force")}
              </button>
            )}
          </div>
        )}
        {!file && (
          <button className="gl-btn gl-btn-outline mb-2">
            <PiFolderOpen /> {t("graph.open.local.button_text")}
          </button>
        )}
      </DropInput>
      {status.type === "loading" && <Loader />}
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
    <Modal title={t("graph.open.local.title")}>
      <OpenLocalFileForm id={"localFileForm"} onStatusChange={(s) => setStatus(s)} status={status} />
      <div className="gl-gap-2 d-flex">
        <button title={t("common.cancel")} className="gl-btn gl-btn-outline" onClick={() => cancel()}>
          {t("common.cancel")}
        </button>
        <button className="gl-btn gl-btn-fill" form="localFileForm" disabled={status.type === "loading"}>
          {t("common.open")}
        </button>
      </div>
    </Modal>
  );
};
