import { FC } from "react";
import { capitalize } from "lodash";
import { useTranslation } from "react-i18next";

import { Selection } from "./Selection";
import { GraphSearch } from "../../components/GraphSearch";
import { ContextIcon } from "../../components/common-icons";
import { useFilteredGraph, useGraphDataset } from "../../core/context/dataContexts";

const GraphStat: FC<{ label: string; current: number; total: number }> = ({ label, current, total }) => (
  <div>
    <span className="fs-5">
      {label} {current}
      {current !== total && (
        <>
          <span className="small">
            /{total}
            <span className="ms-2 text-muted">({((current / total) * 100).toFixed(0)}%)</span>
          </span>
        </>
      )}{" "}
    </span>
  </div>
);

export const ContextPanel: FC = () => {
  const { t } = useTranslation();
  const { fullGraph, metadata } = useGraphDataset();
  const filteredGraph = useFilteredGraph();

  return (
    <>
      <h2 className="fs-4">
        <ContextIcon className="me-1" />
        {metadata.title || t("context.title")}
      </h2>
      <hr />
      <GraphStat
        label={capitalize(t("graph.model.nodes") as string) + ":"}
        current={filteredGraph.order}
        total={fullGraph.order}
      />
      <GraphStat
        label={capitalize(t("graph.model.edges") as string) + ":"}
        current={filteredGraph.size}
        total={fullGraph.size}
      />
      <hr />

      <GraphSearch />
      <hr />

      <Selection />
    </>
  );
};
