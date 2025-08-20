import { useReadAtom } from "@ouestware/atoms";
import { FC } from "react";
import { useTranslation } from "react-i18next";

import { filteredGraphsAtom } from "../../core/graph";

export const FilteredGraphSummary: FC<{ filterIndex: number }> = ({ filterIndex }) => {
  const { t } = useTranslation();
  const filteredGraphs = useReadAtom(filteredGraphsAtom);
  const relatedGraph = filteredGraphs[filterIndex]?.graph;

  return (
    <div>
      {relatedGraph.order} {t("graph.model.nodes", { count: relatedGraph.order })}, {relatedGraph.size}{" "}
      {t("graph.model.edges", { count: relatedGraph.size })}
    </div>
  );
};
