import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaFolderOpen, FaTimes } from "react-icons/fa";

import { DropInput } from "../../../../components/DropInput";
import { Loader } from "../../../../components/Loader";
import { Modal } from "../../../../components/modals";
import { useFile, useFileActions } from "../../../../core/context/dataContexts";
import { ModalProps } from "../../../../core/modals/types";
import { useNotifications } from "../../../../core/notifications";

export const LocalFileModal: FC<ModalProps<unknown>> = ({ cancel }) => {
  const { notify } = useNotifications();
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);

  const {
    status: { type: importStateType },
  } = useFile();
  const { open } = useFileActions();

  return (
    <Modal title={t("graph.open.local.title").toString()} onClose={() => cancel()}>
      <>
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
      </>
      <>
        <button title={t("common.cancel").toString()} className="btn btn-danger" onClick={() => cancel()}>
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
                await open({
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
                notify({
                  type: "error",
                  message: t("graph.open.local.error") as string,
                  title: t("gephi-lite.title") as string,
                });
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
