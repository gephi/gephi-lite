import { ComponentType, FC, useEffect, useMemo, useState } from "react";
import cx from "classnames";
import { BsX } from "react-icons/bs";
import { useTranslation } from "react-i18next";

import { useOpenGexf } from "../../core/graph/useOpenGexf";
import { Layout } from "../layout";
import { GraphDataPanel } from "./GraphDataPanel";
import { StatisticsPanel } from "./StatisticsPanel";
import { AppearancePanel } from "./AppearancePanel";
import { FiltersPanel } from "./FiltersPanel";
import { LayoutsPanel } from "./LayoutsPanel";
import { GraphRendering } from "./GraphRendering";
import { isEqual } from "lodash";
import { AppearanceIcon, FiltersIcon, GraphIcon, LayoutsIcon, StatisticsIcon } from "../../components/common-icons";
import { graphDatasetAtom, refreshSigmaGraph } from "../../core/graph";
import { filtersAtom } from "../../core/filters";
import { appearanceAtom } from "../../core/appearance";
import { useNotifications } from "../../core/notifications";
import { parseDataset } from "../../core/graph/utils";
import { getEmptyFiltersState, parseFiltersState } from "../../core/filters/utils";
import { parseAppearanceState } from "../../core/appearance/utils";

type Tool = { type: "tool"; label: string; icon: ComponentType; panel: ComponentType };

type State = { type: "idle" | "loading" | "ready" } | { type: "error"; error: Error };

export const GraphPage: FC = () => {
  const [tool, setTool] = useState<Tool | null>(null);
  const [state, setState] = useState<State>({ type: "idle" });
  const { openRemoteFile } = useOpenGexf();
  const { t } = useTranslation();
  const { notify } = useNotifications();

  const TOOLS: (Tool | { type: "space" })[] = useMemo(
    () => [
      { type: "tool", label: t("graph.title"), icon: GraphIcon, panel: GraphDataPanel },
      { type: "space" },
      { type: "tool", label: t("statistics.title"), icon: StatisticsIcon, panel: StatisticsPanel },
      { type: "space" },
      { type: "tool", label: t("appearance.title"), icon: AppearanceIcon, panel: AppearancePanel },
      { type: "tool", label: t("filters.title"), icon: FiltersIcon, panel: FiltersPanel },
      { type: "tool", label: t("layouts.title"), icon: LayoutsIcon, panel: LayoutsPanel },
    ],
    [t],
  );

  useEffect(() => {
    if (state.type === "idle") {
      let isSessionStorageValid = false;

      try {
        const rawDataset = sessionStorage.getItem("dataset");
        const rawFilters = sessionStorage.getItem("filters");
        const rawAppearance = sessionStorage.getItem("appearance");

        if (rawDataset) {
          const dataset = parseDataset(rawDataset);

          if (dataset) {
            const appearance = rawAppearance ? parseAppearanceState(rawAppearance) : null;
            const filters = rawFilters ? parseFiltersState(rawFilters) : null;
            refreshSigmaGraph(dataset, filters || getEmptyFiltersState());

            graphDatasetAtom.set(dataset);
            if (filters) filtersAtom.set(filters);
            if (appearance) appearanceAtom.set(appearance);

            isSessionStorageValid = true;
            setState({ type: "ready" });
            notify({
              type: "success",
              message: t("storage.restore_successful") as string,
              title: t("gephi-lite.title") as string,
            });
          }
        }
      } catch (e) {
        notify({
          type: "warning",
          message: t("storage.cannot_restore") as string,
          title: t("gephi-lite.title") as string,
        });
      } finally {
        if (!isSessionStorageValid)
          openRemoteFile({ type: "remote", filename: "arctic.gexf", url: "/gephi-lite/arctic.gexf" })
            .then(() => {
              setState({ type: "ready" });
            })
            .catch((error) => {
              setState({ type: "error", error: error as Error });
            });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.type]);

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
                title={t.label}
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
