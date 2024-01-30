import { FC, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaFolderOpen, FaTimes } from "react-icons/fa";

import { Loader } from "../../../../components/Loader";
import { Modal } from "../../../../components/modals";
import { useImportActions, useImportState } from "../../../../core/context/dataContexts";
import { RemoteFile } from "../../../../core/graph/import/types";
import { ModalProps } from "../../../../core/modals/types";
import { useNotifications } from "../../../../core/notifications";
import { isUrl } from "../../../../utils/check";
import { extractFilename } from "../../../../utils/url";

export const RemoteFileModal: FC<ModalProps<unknown>> = ({ cancel }) => {
  const { notify } = useNotifications();
  const { t } = useTranslation();
  const [url, setUrl] = useState<string>("");

  const { type: fileStateType } = useImportState();
  const { importRemoteGexf } = useImportActions();

  const isFormValid = useMemo(() => {
    return url ? isUrl(url) : false;
  }, [url]);

  const openRemote = useCallback(async () => {
    if (isFormValid) {
      try {
        const file: RemoteFile = { type: "remote", url, filename: extractFilename(url) };
        await importRemoteGexf(file);
        notify({ type: "success", message: t("graph.open.remote.success", { filename: file.filename }).toString() });
        cancel();
      } catch (e) {
        console.error(e);
      }
    }
  }, [isFormValid, url, cancel, notify, t, importRemoteGexf]);

  return (
    <Modal title={t("graph.open.remote.title").toString()} onClose={() => cancel()} onSubmit={openRemote}>
      <>
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
      </>

      <>
        <button
          type="reset"
          title={t("common.cancel").toString()}
          className="btn btn-outline-danger"
          onClick={() => cancel()}
        >
          <FaTimes className="me-1" />
          {t("common.cancel").toString()}
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!isFormValid || fileStateType === "loading"}
          title={url ? t("common.open_file", { filename: extractFilename(url) }).toString() : ""}
        >
          <FaFolderOpen className="me-1" />
          {t("common.open").toString()}
        </button>
      </>
    </Modal>
  );
};
