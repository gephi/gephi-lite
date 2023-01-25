import { ComponentType, FC, useEffect, useMemo, useState } from "react";
import cx from "classnames";
import { BsX } from "react-icons/bs";
import { useTranslation } from "react-i18next";

import { useImportGexf } from "../../core/graph/useImportGexf";
import { Layout } from "../layout";
import { GraphDataPanel } from "./GraphDataPanel";
import { StatisticsPanel } from "./StatisticsPanel";
import { AppearancePanel } from "./AppearancePanel";
import { FiltersPanel } from "./FiltersPanel";
import { LayoutPanel } from "./LayoutPanel";
import { GraphRendering } from "./GraphRendering";
import { isEqual } from "lodash";
import { AppearanceIcon, FiltersIcon, GraphIcon, LayoutIcon, StatisticsIcon } from "../../components/common-icons";

type Tool = { type: "tool"; label: string; icon: ComponentType; panel: ComponentType };

type State = { type: "idle" | "loading" | "ready" } | { type: "error"; error: Error };

export const GraphPage: FC = () => {
  const [tool, setTool] = useState<Tool | null>(null);
  const [state, setState] = useState<State>({ type: "idle" });
  const { importFromUrl } = useImportGexf();
  const { t } = useTranslation();

  const TOOLS: (Tool | { type: "space" })[] = useMemo(
    () => [
      { type: "tool", label: t("graph.title"), icon: GraphIcon, panel: GraphDataPanel },
      { type: "space" },
      { type: "tool", label: t("statistics.title"), icon: StatisticsIcon, panel: StatisticsPanel },
      { type: "space" },
      { type: "tool", label: t("appearance.title"), icon: AppearanceIcon, panel: AppearancePanel },
      { type: "tool", label: t("filters.title"), icon: FiltersIcon, panel: FiltersPanel },
      { type: "tool", label: t("layout.title"), icon: LayoutIcon, panel: LayoutPanel },
    ],
    [t],
  );

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
        <div className="toolbar d-flex flex-column pt-2">
          {TOOLS.map((t, i) =>
            t.type === "space" ? (
              <br key={i} className="my-3" />
            ) : (
              <button
                key={i}
                type="button"
                className={cx("text-center", isEqual(t, tool) && "active")}
                onClick={() => (t === tool ? setTool(null) : setTool(t))}
              >
                <t.icon />
              </button>
            ),
          )}
        </div>
        {tool && (
          <div className="left-panel border-end position-relative">
            <button
              className="btn btn-icon position-absolute top-5 end-5"
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
