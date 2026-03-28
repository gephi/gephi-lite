import { type FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { ModalProps } from "../../../core/modals/types";
import type { AsyncStatus } from "../../../utils/promises";
import { Modal } from "../../modals";
import { OpenLocalFileForm } from "./LocalFileModal";

export const OpenModal: FC<ModalProps<{ initialOpenedTab?: string }>> = ({
  cancel,
}) => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<AsyncStatus>({ type: "idle" });

  useEffect(() => {
    // Closing the modal in case of success
    if (status.type === "success") cancel();
  }, [status, cancel]);

  return (
    <Modal
      className="modal-xl modal-open-graph"
      bodyClassName="p-0"
      title={<span className="gl-px-2">{t("workspace.menu.open").toString()}</span>}
      onClose={() => cancel()}
      doNotPreserveData
    >
      <>
        <div className="selected-component-wrapper">
          <OpenLocalFileForm id="openForm" onStatusChange={setStatus} />
        </div>
      </>
      <div className="gl-gap-2 d-flex">
        <button title={t("common.cancel").toString()} className="gl-btn gl-btn-outline" onClick={() => cancel()}>
          {t("common.cancel").toString()}
        </button>
        <button form="openForm" className="gl-btn gl-btn-fill" disabled={status.type === "loading"}>
          {t("common.open").toString()}
        </button>
      </div>
    </Modal>
  );
};
