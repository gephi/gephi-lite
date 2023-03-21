import { FC } from "react";
import { useTranslation } from "react-i18next";

import { useGraphDataset, useSigmaGraph } from "../../core/context/dataContexts";

const GraphStat: FC<{ label: string; current: number; total: number }> = ({ label, current, total }) => (
  <div>
    <span className="fs-5">
      {label} {current}
      {current !== total && (
        <>
          <span style={{ verticalAlign: "sub", fontSize: "1rem" }}>
            /{total}
            <span className="ms-2">{((current / total) * 100).toFixed(0)}%</span>
          </span>
        </>
      )}{" "}
    </span>
  </div>
);

export const ContextPanel: FC = () => {
  const { fullGraph, metadata } = useGraphDataset();
  const sigmaGraph = useSigmaGraph();
  const { t } = useTranslation();
  return (
    <>
      <h2 className="fs-4">{metadata.title || t("context.title")}</h2>
      <GraphStat label={t("graph.model.nodes")} current={sigmaGraph.order} total={fullGraph.order} />
      <GraphStat label={t("graph.model.edges")} current={sigmaGraph.size} total={fullGraph.size} />
    </>
  );
};
