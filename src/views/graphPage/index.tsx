import { ComponentType, FC, useEffect, useState } from "react";
import cx from "classnames";
import { BsX } from "react-icons/bs";
import { BiNetworkChart } from "react-icons/bi";
import { FaFilter, FaPaintBrush } from "react-icons/fa";
import { ImDatabase, ImStatsDots } from "react-icons/im";
import { t } from "i18next";

import { useImportGexf } from "../../core/graph/useImportGexf";
import { Layout } from "../layout";
import { GraphDataPanel } from "./GraphDataPanel";
import { StatisticsPanel } from "./StatisticsPanel";
import { AppearancePanel } from "./AppearancePanel";
import { FiltersPanel } from "./FiltersPanel";
import { LayoutPanel } from "./LayoutPanel";
import { GraphRendering } from "./GraphRendering";
import { t } from "i18next";

type Tool = { type: "tool"; label: string; icon: ComponentType; panel: ComponentType };

const TOOLS: (Tool | { type: "space" })[] = [
  { type: "tool", label: t("graph.title"), icon: ImDatabase, panel: GraphDataPanel },
  { type: "space" },
  { type: "tool", label: t("statistics.title"), icon: ImStatsDots, panel: StatisticsPanel },
  { type: "space" },
  { type: "tool", label: t("appearance.title"), icon: FaPaintBrush, panel: AppearancePanel },
  { type: "tool", label: t("filters.title"), icon: FaFilter, panel: FiltersPanel },
  { type: "tool", label: t("layout.title"), icon: BiNetworkChart, panel: LayoutPanel },
];

type State = { type: "idle" | "loading" | "ready" } | { type: "error"; error: Error };

export const GraphPage: FC = () => {
  const [tool, setTool] = useState<Tool | null>(null);
  const [state, setState] = useState<State>({ type: "idle" });
  const { importFromUrl } = useImportGexf();

  useEffect(() => {
    if (state.type === "idle") {
      importFromUrl("/gephi-lite/arctic.gexf")
        .then(() => {
          setState({ type: "ready" });
        })
        .catch((error) => {
          setState({ type: "error", error: error as Error });
        });
    }
  }, [state.type, importFromUrl]);

  return (
    <Layout>
      <div id="graph-page">
        <GraphRendering />
        <div className="toolbar d-flex flex-column border-end bg-white">
          {TOOLS.map((t, i) =>
            t.type === "space" ? (
              <br key={i} className="my-3" />
            ) : (
              <button
                key={i}
                type="button"
                className={cx("btn btn-ico text-center text-muted text-capitalize m-1", t === tool && "active")}
                onClick={() => (t === tool ? setTool(null) : setTool(t))}
              >
                <t.icon />
                <br />
                <small>{t.label}</small>
              </button>
            ),
          )}
        </div>
        {tool && (
          <div className="left-panel border-end position-relative bg-white">
            <button
              className="btn btn-icon position-absolute top-0 end-0"
              aria-label="close panel"
              onClick={() => setTool(null)}
            >
              <BsX />
            </button>
            <tool.panel />
          </div>
        )}
        <div className="filler"></div>
        {/*<div className="right-panel border-start bg-white"></div>*/}
      </div>
    </Layout>
  );
};
