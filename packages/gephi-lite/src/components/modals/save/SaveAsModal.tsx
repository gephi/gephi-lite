import { type FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { ModalProps } from "../../../core/modals/types";
import type { AsyncStatus } from "../../../utils/promises";
import { Modal } from "../../modals";
import { SaveLocally } from "./SaveLocally";

export const SaveAsModal: FC<ModalProps<unknown>> = ({ cancel }) => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<AsyncStatus>({ type: "idle" });

  useEffect(() => {
    // Closing the modal in case of success
    if (status.type === "success") cancel();
  }, [status, cancel]);

  return (
    <Modal
      className="modal-lg modal-save-graph"
      bodyClassName="p-0"
      title={<span className="gl-px-2">{t("graph.save.title").toString()}</span>}
      onClose={() => cancel()}
      doNotPreserveData
    >
      <>
        <div className="selected-component-wrapper">
          <SaveLocally id="saveForm" onStatusChange={setStatus} />
        </div>
      </>
    </Modal>
  );
};
