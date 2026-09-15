import { ComponentType } from "react";

import { MenuItem } from "../SideMenu";
import { DataCreationIcon, DataCreationIconFill } from "../common-icons";
import { CreateScriptedFieldModelForm } from "./CreateScriptedFieldModel";
import { EditEdgeForm } from "./EditEdge";
import { EditFieldModelForm } from "./EditFieldModel";
import { EditNodeForm } from "./EditNode";

export type Panel = ComponentType<{ close: () => void }>;

export const DATA_CREATION_MENU_ITEM: MenuItem<{ panel?: Panel }> = {
  id: "data-creation",
  i18nKey: "edition.data_creation",
  icon: { normal: DataCreationIcon, fill: DataCreationIconFill },
  children: [
    {
      id: "data-creation-node",
      i18nKey: "edition.create_nodes",
      panel: ({ close }) => <EditNodeForm onCancel={close} onSubmitted={close} />,
    },
    {
      id: "data-creation-edge",
      i18nKey: "edition.create_edges",
      panel: ({ close }) => <EditEdgeForm onCancel={close} onSubmitted={close} />,
    },
    {
      id: "data-creation-node-field",
      i18nKey: "edition.create_nodes_field",
      panel: ({ close }) => <EditFieldModelForm type="nodes" onCancel={close} onSubmitted={close} />,
    },
    {
      id: "data-creation-edge-field",
      i18nKey: "edition.create_edges_field",
      panel: ({ close }) => <EditFieldModelForm type="edges" onCancel={close} onSubmitted={close} />,
    },
    {
      id: "data-creation-node-scripted-field",
      i18nKey: "edition.create_nodes_scripted_field",
      panel: ({ close }) => <CreateScriptedFieldModelForm type="nodes" onCancel={close} onSubmitted={close} />,
    },
    {
      id: "data-creation-edge-scripted-field",
      i18nKey: "edition.create_edges_scripted_field",
      panel: ({ close }) => <CreateScriptedFieldModelForm type="edges" onCancel={close} onSubmitted={close} />,
    },
  ],
};
