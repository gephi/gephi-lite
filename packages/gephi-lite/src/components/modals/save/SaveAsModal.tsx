import { type ComponentType, type FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { ModalProps } from "../../../core/modals/types";
import type { AsyncStatus } from "../../../utils/promises";
import { type MenuItem, SideMenu } from "../../SideMenu";
import { Modal } from "../../modals";
import { SaveCloudFileForm } from "./SaveCloudFileForm";
import { SaveLocally } from "./SaveLocally";

type SaveCollectionMenuItem = MenuItem<{
  component: ComponentType<{
    id?: string;
    onStatusChange: (status: AsyncStatus) => void;
  }>;
}>;

const SAVE_COLLECTION_MENU: SaveCollectionMenuItem[] = [
  {
    id: "local",
    i18nKey: "graph.save.local.title",
    component: SaveLocally,
  },
  {
    id: "github",
    i18nKey: "graph.save.github.title",
    component: SaveCloudFileForm,
  },
];

export const SaveAsModal: FC<ModalProps<unknown>> = ({ cancel }) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<SaveCollectionMenuItem>(SAVE_COLLECTION_MENU[0]);
  const [status, setStatus] = useState<AsyncStatus>({ type: "idle" });

  useEffect(() => {
    // Closing the modal in case of success
    if (status.type === "success") cancel();
  }, [status, cancel]);

  return (
    <Modal
      className="modal-lg"
      title={<span className="gl-px-2">{t("graph.save.title").toString()}</span>}
      onClose={() => cancel()}
      doNotPreserveData
    >
      <div className="d-flex align-items-stretch">
        <div className="border-end pe-3 me-3">
          <SideMenu
            menu={SAVE_COLLECTION_MENU}
            selected={selected?.id}
            onSelectedChange={(item) => setSelected(item)}
          />
        </div>
        <div className="flex-grow-1">
          <selected.component id="saveForm" onStatusChange={setStatus} />
        </div>
      </div>
      <div className="gl-gap-2 d-flex">
        <button title={t("common.cancel").toString()} className="gl-btn gl-btn-outline" onClick={() => cancel()}>
          {t("common.cancel").toString()}
        </button>
        <button form="saveForm" className="gl-btn gl-btn-fill" disabled={status.type === "loading"}>
          {t("common.save").toString()}
        </button>
      </div>
    </Modal>
  );
};
