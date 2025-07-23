import cx from "classnames";
import { type ComponentType, FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { PiX } from "react-icons/pi";

import { GraphGraphAppearance, GraphItemAppearance } from "../../components/GraphAppearance";
import GraphFilters from "../../components/GraphFilters";
import { GraphSearchSelection } from "../../components/GraphSearchSelection";
import { GraphSummary } from "../../components/GraphSummary";
import { type MenuItem, SideMenu } from "../../components/SideMenu";
import Transition from "../../components/Transition";
import {
  AppearanceIcon,
  AppearanceIconFill,
  CloseIcon,
  FiltersIcon,
  FiltersIconFill,
  LayoutsIcon,
  LayoutsIconFill,
  MenuCollapseIcon,
  MenuExpandIcon,
  MenuPreviousIcon,
  StatisticsIcon,
  StatisticsIconFill,
} from "../../components/common-icons";
import { LayoutQualityForm } from "../../components/forms/LayoutQualityForm";
import { useSelection, useSelectionActions } from "../../core/context/dataContexts";
import { LAYOUTS } from "../../core/layouts/collection";
import { EDGE_METRICS, MIXED_METRICS, NODE_METRICS } from "../../core/metrics/collections";
import { useMobile } from "../../hooks/useMobile";
import { Layout } from "../layout";
import { Header } from "../layout/Header";
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
  const { emptySelection } = useSelectionActions();
  const { t } = useTranslation();
  const isMobile = useMobile();

  // Mobile display:
  const [expanded, setExpanded] = useState(false);

  const selectionPanel = (
    <div className={cx("panel panel-right panel-expandable panel-selection", items.size > 0 && "deployed")}>
      <button
        type="button"
        className="gl-btn-close gl-btn d-none d-sm-block"
        aria-label={t("common.close")}
        onClick={() => emptySelection()}
      >
        <CloseIcon />
      </button>
      {items.size > 0 && <Selection />}
    </div>
  );

  useEffect(() => {
    setExpanded(false);
  }, [items]);

  return (
    <>
      <Header>
        <div className="d-sm-none">
          <button
            className="gl-btn gl-btn-icon"
            onClick={() =>
              items.size ? emptySelection() : selectedTool ? setSelectedTool(undefined) : setExpanded((v) => !v)
            }
          >
            {items.size ? (
              <PiX />
            ) : selectedTool ? (
              <MenuPreviousIcon />
            ) : expanded ? (
              <MenuCollapseIcon />
            ) : (
              <MenuExpandIcon />
            )}
          </button>
        </div>
      </Header>
      <Layout id="graph-page" className="panels-layout">
        {/* Menu panel on left*/}
        <div className={cx("panel panel-left panel-main", (!expanded || !!selectedTool) && "panel-collapsed")}>
          <div className="panel-body">
            <GraphSummary />
            <GraphSearchSelection />
            <SideMenu
              menu={MENU}
              selected={selectedTool?.id}
              onSelectedChange={(item) =>
                setSelectedTool(
                  item.panel && item.id !== selectedTool?.id
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
            <>
              <button
                type="button"
                className="gl-btn-close gl-btn d-none d-sm-block"
                aria-label={t("common.close")}
                onClick={() => setSelectedTool(undefined)}
              >
                <CloseIcon />
              </button>
              <selectedTool.panel />
            </>
          )}
        </div>

        {isMobile && selectionPanel}

        {/* Graph viz */}
        <div className="filler">
          <GraphRendering />
          <Transition
            show={expanded}
            className="overlay"
            mountTransition="fade-in 0.2s forwards"
            unmountTransition="fade-out 0.2s forwards"
            onClick={() => {
              setSelectedTool(undefined);
              setExpanded(false);
            }}
          />
        </div>

        {!isMobile && selectionPanel}
      </Layout>
    </>
  );
};
