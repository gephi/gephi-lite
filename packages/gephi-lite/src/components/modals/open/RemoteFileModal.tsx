import { FC, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useFile, useFileActions } from "../../../core/context/dataContexts";
import { ModalProps } from "../../../core/modals/types";
import { useNotifications } from "../../../core/notifications";
import { isUrl } from "../../../utils/check";
import type { AsyncStatus } from "../../../utils/promises";
import { extractFilename } from "../../../utils/url";
import { Loader } from "../../Loader";
import { Modal } from "../../modals";

interface OpenRemoteFileFormProps {
  id?: string;
  onStatusChange: (status: AsyncStatus) => void;
}
export const OpenRemoteFileForm: FC<OpenRemoteFileFormProps> = ({ id, onStatusChange }) => {
  const { notify } = useNotifications();
  const { t } = useTranslation();
  const [url, setUrl] = useState<string>("");

  const { open } = useFileActions();
  const {
    status: { type: fileStateType },
  } = useFile();

  const onSubmit = useCallback(
    async (url: string) => {
      if (isUrl(url)) {
        try {
          onStatusChange({ type: "loading" });
          const filename = extractFilename(url);
          await open({ type: "remote", url, filename });
          onStatusChange({ type: "success" });
          notify({ type: "success", message: t("graph.open.remote.success", { filename }).toString() });
        } catch (e) {
          onStatusChange({ type: "error" });
          console.error(e);
          notify({
            type: "error",
            message: t("graph.open.remote.error") as string,
            title: t("gephi-lite.title") as string,
          });
        }
      }
    },
    [notify, t, open, onStatusChange],
  );

  return (
    <form
      id={id}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(url);
      }}
    >
      {fileStateType === "error" && (
        <p className="text-center text-danger">{t("graph.open.remote.error").toString()}</p>
      )}

      <div className="mb-3">
        <label htmlFor="url" className="form-label">
          {t("graph.open.remote.url-field")}
        </label>
        <input
          id="url"
          className="form-control"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required={true}
          placeholder="https://gexf.net/data/basic.gexf"
        />
      </div>

      {fileStateType === "loading" && <Loader />}
    </form>
  );
};

export const OpenRemoteFileModal: FC<ModalProps<unknown>> = ({ cancel }) => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<AsyncStatus>({ type: "idle" });

  useEffect(() => {
    // closing the modal on success
    if (status.type === "success") cancel();
  }, [status, cancel]);

  return (
    <Modal title={t("graph.open.local.title").toString()}>
      <OpenRemoteFileForm id={"remoteFileForm"} onStatusChange={(s) => setStatus(s)} />
      <>
        <button title={t("common.cancel").toString()} className="btn btn-outline-dark" onClick={() => cancel()}>
          {t("common.cancel").toString()}
        </button>
        <button className="btn btn-primary" form="localFileForm" disabled={status.type === "loading"}>
          {t("common.open").toString()}
        </button>
      </>
    </Modal>
  );
};
