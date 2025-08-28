import { keyBy } from "lodash";
import { type ComponentType, type FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { ModalProps } from "../../../core/modals/types";
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

const OPEN_COLLECTION_MENU: OpenCollectionMenuItem[] = [
  {
    id: "local",
    i18nKey: "graph.open.local.title",
    component: OpenLocalFileForm,
  },
  {
    id: "github",
    i18nKey: "graph.open.github.title",
    component: OpenCloudFileForm,
  },
];
const OPEN_COLLECTION_MENU_DICT = keyBy(OPEN_COLLECTION_MENU, "id");

export const OpenModal: FC<ModalProps<{ initialOpenedTab?: string }>> = ({
  cancel,
  arguments: { initialOpenedTab },
}) => {
  const { t } = useTranslation();
  const [selectedOpen, setSelectedOpen] = useState<OpenCollectionMenuItem>(
    () => OPEN_COLLECTION_MENU_DICT[initialOpenedTab || ""] || OPEN_COLLECTION_MENU[0],
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
          menu={OPEN_COLLECTION_MENU}
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
