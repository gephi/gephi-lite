import { FC, useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaFolderOpen, FaTimes } from "react-icons/fa";
import { useTranslation } from "react-i18next";

import { isUrl } from "../../../../utils/check";
import { ModalProps } from "../../../../core/modals/types";
import { useOpenGexf } from "../../../../core/graph/useOpenGexf";
import { RemoteFile } from "../../../../core/graph/types";
import { useNotifications } from "../../../../core/notifications";
import { Modal } from "../../../../components/modals";
import { Loader } from "../../../../components/Loader";

function extractFilename(url: string): string {
  return url.split("/").pop() || url;
}

export const RemoteFileModal: FC<ModalProps<{}>> = ({ cancel, submit }) => {
  const navigate = useNavigate();
  const { notify } = useNotifications();
  const { t } = useTranslation();
  const { loading, error, openRemoteFile } = useOpenGexf();
  const [url, setUrl] = useState<string>("");

  const isFormValid = useMemo(() => {
    return url ? isUrl(url) : false;
  }, [url]);

  const openRemote = useCallback(async () => {
    if (isFormValid) {
      try {
        const file: RemoteFile = { type: "remote", url, filename: extractFilename(url) };
        await openRemoteFile(file);
        navigate("/graph");
        notify({ type: "success", message: t("graph.open.remote.success", { filename: file.filename }).toString() });
        cancel();
      } catch (e) {
        console.error(e);
      }
    }
  }, [isFormValid, url, cancel, notify, navigate, t, openRemoteFile]);

  return (
    <Modal title={t("graph.open.remote.title").toString()} onClose={() => cancel()}>
      <>
        {error && <p className="text-center text-danger">{t("graph.open.remote.error").toString()}</p>}

        <form className="row g-3" onSubmit={() => openRemote()}>
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
        </form>
        {loading && <Loader />}
      </>
      <>
        <button title={t("common.cancel").toString()} className="btn btn-outline-danger" onClick={() => cancel()}>
          <FaTimes className="me-1" />
          {t("common.cancel").toString()}
        </button>
        <button
          className="btn btn-primary"
          disabled={!isFormValid || loading}
          title={url ? t("common.open_file", { filename: extractFilename(url) }).toString() : ""}
          onClick={() => openRemote()}
        >
          <FaFolderOpen className="me-1" />
          {t("common.open").toString()}
        </button>
      </>
    </Modal>
  );
};
