import { keyBy } from "lodash";
import { type ComponentType, type FC, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { ModalProps } from "../../../core/modals/types";
import { useConnectedUser } from "../../../core/user";
import type { AsyncStatus } from "../../../utils/promises";
import { type MenuItem, SideMenu } from "../../SideMenu";
import { Modal } from "../../modals";
import { OpenCloudFileForm } from "./CloudFileModal";
import { OpenLocalFileForm } from "./LocalFileModal";

type OpenCollectionMenuItem = MenuItem<{
  component: ComponentType<{
    id?: string;
    onStatusChange: (status: AsyncStatus) => void;
  }>;
}>;

export const OpenModal: FC<ModalProps<{ initialOpenedTab?: string }>> = ({
  cancel,
  arguments: { initialOpenedTab },
}) => {
  const { t } = useTranslation();
  const [user] = useConnectedUser();

  const menu = useMemo<OpenCollectionMenuItem[]>(() => {
    let cloudLabel: string = t("graph.open.github.title");
    if (user?.provider?.type === "dataviz") {
      cloudLabel = "サーバから開く";
    }
    return [
      {
        id: "local",
        i18nKey: "graph.open.local.title",
        component: OpenLocalFileForm,
      },
      {
        id: "github",
        label: cloudLabel,
        component: OpenCloudFileForm,
      },
    ];
  }, [t, user]);

  const menuDict = useMemo(() => keyBy(menu, "id"), [menu]);

  const [selectedOpen, setSelectedOpen] = useState<OpenCollectionMenuItem>(
    () => menuDict[initialOpenedTab || ""] || menu[0],
  );
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
        <SideMenu
          menu={menu}
          selected={selectedOpen?.id}
          onSelectedChange={(item) => setSelectedOpen(item)}
        />
        <div className="selected-component-wrapper">
          <selectedOpen.component id="openForm" onStatusChange={setStatus} />
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
