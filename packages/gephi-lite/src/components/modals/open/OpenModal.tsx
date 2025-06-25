import { type ComponentType, type FC, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { ModalProps } from "../../../core/modals/types";
import type { AsyncStatus } from "../../../utils/promises";
import { NavMenu } from "../../NavMenu";
import { Modal } from "../../modals";
import { OpenCloudFileForm } from "./CloudFileModal";
import { OpenLocalFileForm } from "./LocalFileModal";
import { OpenRemoteFileForm } from "./RemoteFileModal";

const OPEN_COLLECTION = [
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
  const [selectedOpen, setSelectedOpen] = useState<{ id: string; component: ComponentType }>({
    id: "",
    component: () => null,
  });
  const [status, setStatus] = useState<AsyncStatus>({ type: "idle" });

  const openList = useMemo(
    () =>
      OPEN_COLLECTION.map((item) => ({
        id: item.id,
        label: t(item.i18nKey),
        onClick: () =>
          setSelectedOpen({
            id: item.id,
            component: () => <item.component id="openForm" onStatusChange={setStatus} />,
          }),
      })),
    [t],
  );

  useEffect(() => openList[0].onClick(), [openList]);

  useEffect(() => {
    console.log(status);
    // Closing the modal in case of success
    if (status.type === "success") cancel();
  }, [status, cancel]);

  return (
    <Modal className="modal-lg" title={t("workspace.menu.open").toString()} onClose={() => cancel()} doNotPreserveData>
      <div className="d-flex align-items-stretch overflow-hidden">
        <div className="border-end pe-3 me-3 overflow-hidden">
          <NavMenu menu={openList} selected={selectedOpen?.id} />
        </div>
        <div className="flex-grow-1 overflow-scroll">
          <selectedOpen.component />
        </div>
      </div>
      <>
        <button title={t("common.cancel").toString()} className="btn btn-outline-dark" onClick={() => cancel()}>
          {t("common.cancel").toString()}
        </button>
        <button form="openForm" className="btn btn-primary" disabled={status.type === "loading"}>
          {t("common.open").toString()}
        </button>
      </>
    </Modal>
  );
};
