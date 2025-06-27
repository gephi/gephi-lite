import { type ComponentType, type FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { ModalProps } from "../../../core/modals/types";
import type { AsyncStatus } from "../../../utils/promises";
import { type MenuItem, NavMenu } from "../../NavMenu";
import { Modal } from "../../modals";
import { OpenCloudFileForm } from "./CloudFileModal";
import { OpenLocalFileForm } from "./LocalFileModal";
import { OpenRemoteFileForm } from "./RemoteFileModal";

type OpenCollectionMenuItem = MenuItem<{
  component: ComponentType<{
    id?: string;
    onStatusChange: (status: AsyncStatus) => void;
  }>;
}>;

const OPEN_COLLECTION_MENU: OpenCollectionMenuItem[] = [
  {
    id: "local",
    i18nKey: "graph.open.local.title",
    component: OpenLocalFileForm,
  },
  {
    id: "remote",
    i18nKey: "graph.open.remote.title",
    component: OpenRemoteFileForm,
  },
  {
    id: "github",
    i18nKey: "graph.open.github.title",
    component: OpenCloudFileForm,
  },
];

export const OpenModal: FC<ModalProps<unknown>> = ({ cancel }) => {
  const { t } = useTranslation();
  const [selectedOpen, setSelectedOpen] = useState<OpenCollectionMenuItem>(OPEN_COLLECTION_MENU[0]);
  const [status, setStatus] = useState<AsyncStatus>({ type: "idle" });

  useEffect(() => {
    console.log(status);
    // Closing the modal in case of success
    if (status.type === "success") cancel();
  }, [status, cancel]);

  return (
    <Modal
      className="modal-lg"
      title={<span className="gl-px-sm">{t("workspace.menu.open").toString()}</span>}
      onClose={() => cancel()}
      doNotPreserveData
    >
      <div className="d-flex align-items-stretch">
        <div className="border-end pe-3 me-3">
          <NavMenu
            menu={OPEN_COLLECTION_MENU}
            selected={selectedOpen?.id}
            onSelectedChange={(item) => setSelectedOpen(item)}
          />
        </div>
        <div className="flex-grow-1">
          <selectedOpen.component id="openForm" onStatusChange={setStatus} />
        </div>
      </div>
      <div className="gl-gap-sm d-flex">
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
