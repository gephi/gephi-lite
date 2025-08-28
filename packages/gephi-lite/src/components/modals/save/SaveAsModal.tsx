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
      className="modal-lg modal-save-graph"
      bodyClassName="p-0"
      title={<span className="gl-px-2">{t("graph.save.title").toString()}</span>}
      onClose={() => cancel()}
      doNotPreserveData
    >
      <>
        <SideMenu menu={SAVE_COLLECTION_MENU} selected={selected?.id} onSelectedChange={(item) => setSelected(item)} />
        <div className="selected-component-wrapper">
          <selected.component id="saveForm" onStatusChange={setStatus} />
        </div>
      </>
    </Modal>
  );
};
