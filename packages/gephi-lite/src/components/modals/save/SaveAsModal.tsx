import { type ComponentType, type FC, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { ModalProps } from "../../../core/modals/types";
import { useConnectedUser } from "../../../core/user";
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

export const SaveAsModal: FC<ModalProps<unknown>> = ({ cancel }) => {
  const { t } = useTranslation();
  const [user] = useConnectedUser();

  const menu = useMemo<SaveCollectionMenuItem[]>(() => {
    let cloudLabel: string = t("graph.save.github.title");
    if (user?.provider?.type === "dataviz") {
      cloudLabel = "サーバに保存";
    }

    return [
      {
        id: "local",
        i18nKey: "graph.save.local.title",
        component: SaveLocally,
      },
      {
        id: "github",
        label: cloudLabel,
        component: SaveCloudFileForm,
      },
    ];
  }, [t, user]);

  const [selected, setSelected] = useState<SaveCollectionMenuItem>(menu[0]);
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
        <SideMenu menu={menu} selected={selected?.id} onSelectedChange={(item) => setSelected(item)} />
        <div className="selected-component-wrapper">
          <selected.component id="saveForm" onStatusChange={setStatus} />
        </div>
      </>
    </Modal>
  );
};
