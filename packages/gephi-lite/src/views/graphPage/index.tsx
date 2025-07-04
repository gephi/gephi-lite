import cx from "classnames";
import { type ComponentType, FC, useState } from "react";
import { useTranslation } from "react-i18next";

import { GraphGraphAppearance, GraphItemAppearance } from "../../components/GraphAppearance";
import GraphFilters from "../../components/GraphFilters";
import { GraphSearchSelection } from "../../components/GraphSearchSelection";
import { GraphSummary } from "../../components/GraphSummary";
import { type MenuItem, SideMenu } from "../../components/SideMenu";
import {
  AppearanceIcon,
  AppearanceIconFill,
  CloseIcon,
  FiltersIcon,
  FiltersIconFill,
  LayoutsIcon,
  LayoutsIconFill,
  StatisticsIcon,
  StatisticsIconFill,
} from "../../components/common-icons";
import { LayoutQualityForm } from "../../components/forms/LayoutQualityForm";
import { useSelection } from "../../core/context/dataContexts";
import { LAYOUTS } from "../../core/layouts/collection";
import { EDGE_METRICS, MIXED_METRICS, NODE_METRICS } from "../../core/metrics/collections";
import { Layout } from "../layout";
import { GraphRendering } from "./GraphRendering";
import { Selection } from "./Selection";
import { LabelsPanel } from "./panels/LabelsPanel";
import { StatisticsPanel } from "./panels/StatisticsPanel";
import { LayoutPanel } from "./panels/layouts/LayoutPanel";

const MENU: MenuItem<{ panel?: ComponentType }>[] = [
  {
    id: "layout",
    i18nKey: "layouts.title",
    icon: { normal: LayoutsIcon, fill: LayoutsIconFill },
    children: [
      ...LAYOUTS.map((layout) => ({
        id: `layout-${layout.id}`,
        i18nKey: `layouts.${layout.id}.title`,
        panel: () => <LayoutPanel layout={layout} />,
      })),
      { id: "layout-quality", i18nKey: "layouts.quality.title", panel: () => <LayoutQualityForm /> },
    ],
  },
  {
    id: "appearance",
    i18nKey: "appearance.title",
    icon: { normal: AppearanceIcon, fill: AppearanceIconFill },
    children: [
      {
        id: "appearance-nodes",
        i18nKey: "appearance.menu.nodes",
        panel: () => <GraphItemAppearance itemType="nodes" />,
      },
      {
        id: "appearance-edges",
        i18nKey: "appearance.menu.edges",
        panel: () => <GraphItemAppearance itemType="edges" />,
      },
      {
        id: "appearance-labels",
        i18nKey: "appearance.menu.labels",
        panel: () => <LabelsPanel />,
      },
      {
        id: "appearance-background",
        i18nKey: "appearance.menu.background",
        panel: () => <GraphGraphAppearance />,
      },
    ],
  },
  {
    id: "filters",
    i18nKey: "filters.title",
    icon: { normal: FiltersIcon, fill: FiltersIconFill },
    panel: () => <GraphFilters />,
  },
  {
    id: "statistics",
    i18nKey: "statistics.title",
    icon: { normal: StatisticsIcon, fill: StatisticsIconFill },
    children: [
      { type: "nodes", metrics: NODE_METRICS },
      { type: "edges", metrics: EDGE_METRICS },
      { type: "mixed", metrics: MIXED_METRICS },
    ].flatMap(({ type, metrics }) => [
      {
        id: type,
        type: "text",
        i18nKey: `graph.model.${type}`,
        className: "gl-heading-3",
        capitalize: true,
      },
      ...metrics.map((metric) => ({
        id: metric.id,
        i18nKey: `statistics.${type}.${metric.id}.title`,
        panel: () => <StatisticsPanel metric={metric} />,
      })),
    ]),
  },
];

export const GraphPage: FC = () => {
  const [selectedTool, setSelectedTool] = useState<undefined | { id: string; panel: ComponentType }>(undefined);
  const { items } = useSelection();
  const { t } = useTranslation();

  return (
    <Layout id="graph-page" className="panels-layout">
      {/* Menu panel on left*/}
      <div className="panel">
        <div className="panel-body">
          <GraphSummary />
          <GraphSearchSelection />
          <SideMenu
            menu={MENU}
            selected={selectedTool?.id}
            onSelectedChange={(item) =>
              setSelectedTool(
                item.panel
                  ? {
                      id: item.id,
                      panel: item.panel,
                    }
                  : undefined,
              )
            }
          />
        </div>
      </div>

      {/* Extended left panel */}
      <div className={cx("panel panel-left panel-expandable", selectedTool && "deployed")}>
        {selectedTool && (
          <div className="panel-body">
            <button
              type="button"
              className="gl-btn-close gl-btn"
              aria-label={t("commons.close")}
              onClick={() => setSelectedTool(undefined)}
            >
              <CloseIcon />
            </button>
            <selectedTool.panel />
          </div>
        )}
      </div>

      {/* Graph viz */}
      <div className="filler">
        <GraphRendering />
      </div>

      {/* Right panel */}
      <div className={cx("panel panel-expandable ", items.size > 0 && "deployed")}>
        <div className="panel-body">{items.size > 0 && <Selection />}</div>
      </div>
    </Layout>
  );
};
