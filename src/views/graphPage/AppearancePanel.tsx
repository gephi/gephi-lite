import { FC, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { GraphGraphAppearance, GraphItemAppearance } from "../../components/GraphAppearance";
import { ToggleBar } from "../../components/Toggle";
import { AppearanceIcon, EdgeIcon, GraphIcon, NodeIcon } from "../../components/common-icons";

export const AppearancePanel: FC = () => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState("nodes");
  const tabs = useMemo(() => {
    return [
      {
        value: "nodes",
        label: (
          <>
            <NodeIcon className="me-1" /> {t("graph.model.nodes")}
          </>
        ),
      },
      {
        value: "edges",
        label: (
          <>
            <EdgeIcon className="me-1" /> {t("graph.model.edges")}
          </>
        ),
      },
      {
        value: "graph",
        label: (
          <>
            <GraphIcon className="me-1" /> {t("graph.model.graph")}
          </>
        ),
      },
    ];
  }, [t]);
  return (
    <>
      <div className="panel-block pb-0">
        <h2 className="fs-4">
          <AppearanceIcon className="me-1" /> {t("appearance.title")}{" "}
        </h2>
        <ToggleBar
          className="mt-1 justify-content-center"
          value={selected}
          onChange={(e) => setSelected(e)}
          options={tabs}
        />
      </div>
      <hr className="m-0" />

      {selected === "nodes" && <GraphItemAppearance itemType="nodes" />}
      {selected === "edges" && <GraphItemAppearance itemType="edges" />}
      {selected === "graph" && <GraphGraphAppearance />}
    </>
  );
};
