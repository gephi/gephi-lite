import { isEqual } from "lodash";
import { ComponentType, FC, useEffect, useMemo, useState } from "react";
import cx from "classnames";
import { BsX } from "react-icons/bs";
import { useTranslation } from "react-i18next";

import { Layout } from "../layout";
import { GraphDataPanel } from "./GraphDataPanel";
import { StatisticsPanel } from "./StatisticsPanel";
import { AppearancePanel } from "./AppearancePanel";
import { FiltersPanel } from "./FiltersPanel";
import { LayoutsPanel } from "./LayoutsPanel";
import { GraphRendering } from "./GraphRendering";
import { AppearanceIcon, FiltersIcon, GraphIcon, LayoutsIcon, StatisticsIcon } from "../../components/common-icons";
import { graphDatasetAtom, refreshSigmaGraph } from "../../core/graph";
import { filtersAtom } from "../../core/filters";
import { appearanceAtom } from "../../core/appearance";
import { useNotifications } from "../../core/notifications";
import { parseDataset } from "../../core/graph/utils";
import { getEmptyFiltersState, parseFiltersState } from "../../core/filters/utils";
import { getEmptyAppearanceState, parseAppearanceState } from "../../core/appearance/utils";
import { useModal } from "../../core/modals";
import { WelcomeModal } from "./modals/WelcomeModal";

type Tool = { type: "tool"; label: string; icon: ComponentType<{ className?: string }>; panel: ComponentType };
type Button = { type: "button"; label: string; icon: ComponentType<{ className?: string }>; onClick: () => void };
type State = { type: "idle" | "loading" | "ready" } | { type: "error"; error: Error };

const GephiLiteButton: FC = () => {
  const { t } = useTranslation();
  return (
    <img src={`${process.env.PUBLIC_URL}/gephi-logo.svg`} style={{ width: "2em" }} alt={t("welcome.logo") as string} />
  );
};

export const GraphPage: FC = () => {
  const [tool, setTool] = useState<Tool | null>(null);
  const [state, setState] = useState<State>({ type: "idle" });
  const { t } = useTranslation();
  const { notify } = useNotifications();
  const { openModal } = useModal();

  const TOOLS: (Tool | Button | { type: "space" })[] = useMemo(
    () => [
      {
        type: "button",
        label: t("gephi-lite.title"),
        icon: GephiLiteButton,
        onClick: () => {
          openModal({
            component: WelcomeModal,
            arguments: {},
          });
        },
      },
      { type: "space" },
      { type: "tool", label: t("graph.title"), icon: GraphIcon, panel: GraphDataPanel },
      { type: "space" },
      { type: "tool", label: t("statistics.title"), icon: StatisticsIcon, panel: StatisticsPanel },
      { type: "space" },
      { type: "tool", label: t("appearance.title"), icon: AppearanceIcon, panel: AppearancePanel },
      { type: "tool", label: t("filters.title"), icon: FiltersIcon, panel: FiltersPanel },
      { type: "tool", label: t("layouts.title"), icon: LayoutsIcon, panel: LayoutsPanel },
    ],
    [openModal, t],
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
            filtersAtom.set(filters || getEmptyFiltersState());
            appearanceAtom.set(appearance || getEmptyAppearanceState());

            isSessionStorageValid = true;
            setState({ type: "ready" });
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
          openModal({
            component: WelcomeModal,
            arguments: {},
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
                className={cx("text-center fs-5", isEqual(t, tool) && "active")}
                onClick={() => {
                  if (t.type === "tool") {
                    if (t === tool) setTool(null);
                    else setTool(t);
                  } else if (t.type === "button") {
                    t.onClick();
                  }
                }}
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
      </div>
    </Layout>
  );
};
