import { FC, useState } from "react";
import { FaFolderOpen, FaTimes } from "react-icons/fa";
import { useTranslation } from "react-i18next";

import { ModalProps } from "../../../../core/modals/types";
import { useOpenGexf } from "../../../../core/graph/useOpenGexf";
import { useNotifications } from "../../../../core/notifications";
import { Modal } from "../../../../components/modals";
import { Loader } from "../../../../components/Loader";
import { DropInput } from "../../../../components/DropInput";

export const LocalFileModal: FC<ModalProps<{}>> = ({ cancel, submit }) => {
  const { notify } = useNotifications();
  const { t } = useTranslation();
  const { loading, error, openLocalFile } = useOpenGexf();
  const [file, setFile] = useState<File | null>(null);

  return (
    <Modal title={t("graph.open.local.title").toString()} onClose={() => cancel()}>
      <>
        {error && <p className="text-center text-danger">{t("graph.open.local.error").toString()}</p>}
        <DropInput
          value={file}
          onChange={(file) => setFile(file)}
          helpText={t("graph.open.local.dragndrop_text").toString()}
          accept={{ "application/graph": [".gexf"] }}
        />
        {loading && <Loader />}
      </>
      <>
        <button title={t("common.cancel").toString()} className="btn btn-outline-danger" onClick={() => cancel()}>
          <FaTimes className="me-1" />
          {t("common.cancel").toString()}
        </button>
        <button
          className="btn btn-primary"
          disabled={!file}
          title={file ? t("common.open_file", { filename: file.name }).toString() : ""}
          onClick={async () => {
            if (file) {
              try {
                await openLocalFile({
                  type: "local",
                  filename: file.name,
                  updatedAt: new Date(file.lastModified),
                  size: file.size,
                  source: file,
                });
                notify({
                  type: "success",
                  message: t("graph.open.local.success", { filename: file.name }).toString(),
                });
                cancel();
              } catch (e) {
                console.error(e);
              }
            }
          }}
        >
          <FaFolderOpen className="me-1" />
          {t("common.open").toString()}
        </button>
      </>
    </Modal>
  );
};
