import cx from "classnames";
import { type ComponentType, FC, ReactNode, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { PiCaretDown, PiCaretRight } from "react-icons/pi";
import { ScrollSync } from "react-scroll-sync";

import { GraphGraphAppearance, GraphItemAppearance } from "../../components/GraphAppearance";
import GraphFilters from "../../components/GraphFilters";
import { GraphSearchSelection } from "../../components/GraphSearchSelection";
import { GraphSummary } from "../../components/GraphSummary";
import { type MenuItem, NavMenu, ToolSection } from "../../components/NavMenu";
import {
  AppearanceIcon,
  AppearanceIconFill,
  FiltersIcon,
  FiltersIconFill,
  LayoutsIcon,
  LayoutsIconFill,
  StatisticsIcon,
  StatisticsIconFill,
} from "../../components/common-icons";
import { useDataTable, useFilteredGraph, useGraphDataset } from "../../core/context/dataContexts";
import { LAYOUTS } from "../../core/layouts/collection";
import { doesItemMatch } from "../../utils/search";
import { StatisticsPanel } from "../graphPage/panels/StatisticsPanel";
import { LayoutsPanel } from "../graphPage/panels/layouts/LayoutPanel";
import { Layout } from "../layout";
import { TopBar } from "./TopBar";
import { DataTable } from "./dataTable/DataTable";

const TOOL_MENU: ToolSection[] = [
  {
    id: "layout",
    i18nKey: "layouts.title",
    icon: { normal: LayoutsIcon, fill: LayoutsIconFill },
    children: LAYOUTS.map((layout) => ({
      id: `layout-${layout.id}`,
      i18nKey: `layouts.${layout.id}.title`,
      panel: () => <LayoutsPanel layout={layout} />,
    })),
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
        panel: () => <div>TODO</div>,
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
    panel: StatisticsPanel,
  },
];

const Panel: FC<{ collapsed?: boolean; children: [ReactNode, ReactNode] }> = ({
  collapsed,
  children: [label, content],
}) => {
  const [isCollapsed, setIsCollapsed] = useState(!!collapsed);

  useEffect(() => {
    setIsCollapsed(!!collapsed);
  }, [collapsed]);

  return (
    <>
      <div className="table-top-bar d-flex flex-row align-items-baseline p-2">
        <span className="flex-grow-1">{label}</span>
        <button type="button" className="flex-shrink-0 btn btn-light" onClick={() => setIsCollapsed((v) => !v)}>
          {isCollapsed ? <PiCaretRight /> : <PiCaretDown />}
        </button>
      </div>
      <div className={cx("flex-grow-1 flex-shrink-1 position-relative", isCollapsed && "d-none")}>{content}</div>
      <div className="border border-bottom" />
    </>
  );
};

export const DataPage: FC = () => {
  const { type, search } = useDataTable();
  const { t } = useTranslation();
  const { nodeData, edgeData, nodeRenderingData, edgeRenderingData, nodeFields, edgeFields } = useGraphDataset();
  const graph = useFilteredGraph();
  const { matchingItems, otherItems } = useMemo(() => {
    let matchingItems: string[] = [];
    const otherItems: string[] = [];

    const allIDs = type === "nodes" ? graph.nodes() : graph.edges();
    const data = type === "nodes" ? nodeData : edgeData;
    const renderingData = type === "nodes" ? nodeRenderingData : edgeRenderingData;
    const fields = type === "nodes" ? nodeFields : edgeFields;
    if (search) {
      allIDs.forEach((id) => {
        if (doesItemMatch(id, renderingData[id].label, data[id], fields, search)) {
          matchingItems.push(id);
        } else {
          otherItems.push(id);
        }
      });
    } else {
      matchingItems = allIDs;
    }

    return { matchingItems, otherItems };
  }, [type, graph, nodeData, edgeData, nodeRenderingData, edgeRenderingData, nodeFields, edgeFields, search]);

  const [selectedTool, setSelectedTool] = useState<undefined | { id: string; panel: ComponentType }>(undefined);
  const toolsMenu = useMemo(
    () =>
      TOOL_MENU.map((item) => {
        if ("children" in item) {
          return {
            id: item.id,
            label: t(item.i18nKey),
            icon: item.icon,
            children: item.children.map((subItem) => ({
              id: subItem.id,
              label: t(subItem.i18nKey),
              onClick: () => setSelectedTool({ id: subItem.id, panel: subItem.panel }),
            })),
          };
        } else {
          return {
            id: item.id,
            label: t(item.i18nKey),
            icon: item.icon,
            onClick: () => setSelectedTool({ id: item.id, panel: item.panel }),
          };
        }
      }) as MenuItem[],
    [t],
  );

  return (
    <Layout id="data-page" className="panels-layout">
      {/* Menu panel on left*/}
      <div className="left-panel">
        <GraphSummary className="px-3 mb-3" />
        <GraphSearchSelection className="mb-3 mx-1" />
        <NavMenu className="mx-2" menu={toolsMenu} selected={selectedTool?.id} />
      </div>

      {/* Extended left panel */}
      <div className={cx("left-panel-wrapper", selectedTool && "deployed")}>
        {selectedTool && (
          <>
            <button
              type="button"
              className="btn-close float-end"
              aria-label="Close"
              onClick={() => setSelectedTool(undefined)}
            ></button>
            <selectedTool.panel />
          </>
        )}
      </div>

      {/* Data tables */}
      <div className="filler">
        <ScrollSync enabled horizontal vertical={false}>
          <div className="tables-container">
            <TopBar />
            {search ? (
              <>
                <Panel>
                  <>
                    <strong>{matchingItems.length}</strong> {type} matching the search query
                  </>
                  <DataTable itemIDs={matchingItems} />
                </Panel>
                <Panel collapsed>
                  <>
                    <strong>{otherItems.length}</strong> {type} not matching the search query
                  </>
                  <DataTable itemIDs={otherItems} />
                </Panel>
              </>
            ) : (
              <section className="flex-grow-1 position-relative">
                <DataTable itemIDs={matchingItems} />
              </section>
            )}
          </div>
        </ScrollSync>
      </div>
    </Layout>
  );
};
