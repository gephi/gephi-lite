import cx from "classnames";
import { FC, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

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
  MetricsIcon,
  MetricsIconFill,
  PanelCollapseIcon,
} from "../../components/common-icons";
import { DATA_CREATION_MENU_ITEM, type Panel } from "../../components/data/DataCreationMenu";
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
import { MetricsPanel } from "./panels/MetricsPanel";
import { LayoutPanel } from "./panels/layouts/LayoutPanel";

const MENU: MenuItem<{ panel?: Panel }>[] = [
  DATA_CREATION_MENU_ITEM,
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
    id: "metrics",
    i18nKey: "metrics.title",
    icon: { normal: MetricsIcon, fill: MetricsIconFill },
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
        i18nKey: `metrics.${type}.${metric.id}.title`,
        panel: () => <MetricsPanel metric={metric} />,
      })),
    ]),
  },
];

export const GraphPage: FC = () => {
  const [selectedTool, setSelectedTool] = useState<undefined | { id: string; panel: Panel }>(undefined);
  const { items } = useSelection();
  const { emptySelection } = useSelectionActions();
  const { t } = useTranslation();
  const isMobile = useMobile();

  // Mobile display:
  const [expanded, setExpanded] = useState(false);
  // On a small screen the selection panel and the menu panel are stacked and cannot both be open,
  // so the selection panel has to be foldable without losing the selection - otherwise the search
  // field underneath is only reachable by emptying the selection first. Any change of selection
  // unfolds it again, which is the way back: there is no "reopen" button.
  const [selectionCollapsed, setSelectionCollapsed] = useState(false);

  // Lets the filters badge in GraphSummary open the Filters panel directly, reusing the same id as
  // its entry in MENU so the side menu highlights it as selected, like clicking it there would.
  const openFilters = useCallback(() => {
    setSelectedTool({ id: "filters", panel: () => <GraphFilters /> });
  }, []);

  const isSelectionPanelDeployed = items.size > 0 && !selectionCollapsed;
  // The search box's panel (panel-main) only actually collapses on mobile (see the panel-collapsed
  // rule in _panel.scss, scoped to that breakpoint) - on desktop it stays visible regardless of
  // `expanded`/`selectedTool`, which only affect the extended panel next to it.
  const isSearchPanelVisible = !isMobile || (expanded && !selectedTool);
  const selectionPanel = (
    <div className={cx("panel panel-right panel-expandable panel-selection", isSelectionPanelDeployed && "deployed")}>
      <button
        type="button"
        className="gl-btn-close gl-btn d-none d-sm-block"
        aria-label={t("common.close")}
        onClick={() => emptySelection()}
      >
        <CloseIcon />
      </button>
      {isSelectionPanelDeployed && <Selection />}
    </div>
  );

  useEffect(() => {
    setExpanded(false);
    setSelectionCollapsed(false);
  }, [items]);

  return (
    <>
      <Header>
        <div className="d-sm-none">
          {/* Folds the selection panel back down first (the selection itself is emptied from the
              panel's own button, so that reaching the panels underneath never loses it). */}
          <button
            className="gl-btn gl-btn-icon"
            title={isSelectionPanelDeployed ? t("selection.hide_panel") : undefined}
            aria-label={isSelectionPanelDeployed ? t("selection.hide_panel") : undefined}
            onClick={() =>
              isSelectionPanelDeployed
                ? setSelectionCollapsed(true)
                : selectedTool
                  ? setSelectedTool(undefined)
                  : setExpanded((v) => !v)
            }
          >
            {isSelectionPanelDeployed ? (
              <PanelCollapseIcon />
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
            <GraphSummary onOpenFilters={openFilters}>
              <GraphSearchSelection visible={isSearchPanelVisible} />
            </GraphSummary>
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
              <selectedTool.panel close={() => setSelectedTool(undefined)} />
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
