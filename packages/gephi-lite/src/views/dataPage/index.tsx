import cx from "classnames";
import { type ComponentType, FC, ReactNode, useEffect, useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { PiCaretDown, PiCaretRight } from "react-icons/pi";
import { ScrollSync } from "react-scroll-sync";

import GraphFilters from "../../components/GraphFilters";
import { GraphSearchSelection } from "../../components/GraphSearchSelection";
import { GraphSummary } from "../../components/GraphSummary";
import { type MenuItem, NavMenu } from "../../components/NavMenu";
import {
  FiltersIcon,
  FiltersIconFill,
  GraphIcon,
  GraphIconFill,
  StatisticsIcon,
  StatisticsIconFill,
} from "../../components/common-icons";
import { useDataTable, useFilteredGraph, useGraphDataset } from "../../core/context/dataContexts";
import { doesItemMatch } from "../../utils/search";
import { StatisticsPanel } from "../graphPage/panels/StatisticsPanel";
import { Layout } from "../layout";
import { TopBar } from "./TopBar";
import { DataTable } from "./dataTable/DataTable";

const MENU: MenuItem<{ panel?: ComponentType }>[] = [
  {
    id: "data-creation",
    i18nKey: "edition.data_creation",
    icon: { normal: GraphIcon, fill: GraphIconFill },
    children: [
      {
        id: "data-creation-node",
        i18nKey: "edition.create_nodes",
        panel: () => <>TODO</>,
      },
      {
        id: "data-creation-edge",
        i18nKey: "edition.create_edges",
        panel: () => <>TODO</>,
      },
      {
        id: "data-creation-node-field",
        i18nKey: "edition.create_nodes_field",
        panel: () => <>TODO</>,
      },
      {
        id: "data-creation-edge-field",
        i18nKey: "edition.create_edges_field",
        panel: () => <>TODO</>,
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
  collapsed = false,
  children: [label, content],
}) => {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  useEffect(() => {
    setIsCollapsed(collapsed);
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
  const { t } = useTranslation();
  const { type, search } = useDataTable();
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

  return (
    <Layout id="data-page" className="panels-layout">
      {/* Menu panel on left*/}
      <div className="left-panel">
        <GraphSummary className="px-3 mb-3" />
        <GraphSearchSelection className="mb-3 mx-1" />
        <NavMenu
          className="mx-2"
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

      {/* Extended left panel */}
      <div className={cx("left-panel-wrapper", selectedTool && "deployed")}>
        {selectedTool && (
          <>
            <button
              type="button"
              className="btn-close float-end"
              aria-label={t("commons.close")}
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
                  <Trans i18nKey={`datatable.${type}_matching`} count={matchingItems.length} />
                  <DataTable itemIDs={matchingItems} />
                </Panel>
                <Panel collapsed>
                  <Trans i18nKey={`datatable.${type}_not_matching`} count={otherItems.length} />
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
