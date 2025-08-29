import { ItemType } from "@gephi/gephi-lite-sdk";
import cx from "classnames";
import { type ComponentType, FC, ReactNode, useEffect, useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { PiCaretDown, PiCaretRight } from "react-icons/pi";
import { ScrollSync } from "react-scroll-sync";

import GraphFilters from "../../components/GraphFilters";
import { GraphSearchSelection } from "../../components/GraphSearchSelection";
import { GraphSummary } from "../../components/GraphSummary";
import { type MenuItem, SideMenu } from "../../components/SideMenu";
import Transition from "../../components/Transition";
import {
  CloseIcon,
  DataCreationIcon,
  DataCreationIconFill,
  FiltersIcon,
  FiltersIconFill,
  MenuCollapseIcon,
  MenuExpandIcon,
  MenuPreviousIcon,
  MetricsIcon,
  MetricsIconFill,
} from "../../components/common-icons";
import { CreateScriptedFieldModelForm } from "../../components/data/CreateScriptedFieldModel";
import { EditEdgeForm } from "../../components/data/EditEdge";
import { EditFieldModelForm } from "../../components/data/EditFieldModel";
import { EditNodeForm } from "../../components/data/EditNode";
import {
  useDataTable,
  useDataTableActions,
  useDynamicItemData,
  useFilteredGraph,
  useGraphDataset,
  useSelection,
  useVisualGetters,
} from "../../core/context/dataContexts";
import { mergeStaticDynamicData } from "../../core/graph/dynamicAttributes";
import { EDGE_METRICS, MIXED_METRICS, NODE_METRICS } from "../../core/metrics/collections";
import { doesItemMatch } from "../../utils/search";
import { MetricsPanel } from "../graphPage/panels/MetricsPanel";
import { Layout } from "../layout";
import { Header } from "../layout/Header";
import { TopBar } from "./TopBar";
import { DataTable } from "./dataTable/DataTable";

type Panel = ComponentType<{ close: () => void }>;

const MENU: MenuItem<{ panel?: Panel }>[] = [
  {
    id: "data-creation",
    i18nKey: "edition.data_creation",
    icon: { normal: DataCreationIcon, fill: DataCreationIconFill },
    children: [
      {
        id: "data-creation-node",
        i18nKey: "edition.create_nodes",
        panel: ({ close }) => <EditNodeForm onCancel={close} onSubmitted={close} />,
      },
      {
        id: "data-creation-edge",
        i18nKey: "edition.create_edges",
        panel: ({ close }) => <EditEdgeForm onCancel={close} onSubmitted={close} />,
      },
      {
        id: "data-creation-node-field",
        i18nKey: "edition.create_nodes_field",
        panel: ({ close }) => <EditFieldModelForm type="nodes" onCancel={close} onSubmitted={close} />,
      },
      {
        id: "data-creation-edge-field",
        i18nKey: "edition.create_edges_field",
        panel: ({ close }) => <EditFieldModelForm type="edges" onCancel={close} onSubmitted={close} />,
      },
      {
        id: "data-creation-node-scripted-field",
        i18nKey: "edition.create_nodes_scripted_field",
        panel: ({ close }) => <CreateScriptedFieldModelForm type="nodes" onCancel={close} onSubmitted={close} />,
      },
      {
        id: "data-creation-edge-scripted-field",
        i18nKey: "edition.create_edges_scripted_field",
        panel: ({ close }) => <CreateScriptedFieldModelForm type="edges" onCancel={close} onSubmitted={close} />,
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

const Panel: FC<{ collapsed?: boolean; borderBottom?: boolean; children: [ReactNode, ReactNode] }> = ({
  collapsed = false,
  children: [label, content],
  borderBottom,
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
      <div
        className={cx(
          "flex-grow-1 flex-shrink-1 position-relative",
          isCollapsed && "d-none",
          borderBottom && "border-bottom",
        )}
      >
        {content}
      </div>
    </>
  );
};

export const DataPage: FC<{ type: ItemType }> = ({ type: inputType }) => {
  const { t } = useTranslation();
  const { items } = useSelection();
  const { type, search } = useDataTable();
  const { setType } = useDataTableActions();
  const { getNodeLabel, getEdgeLabel } = useVisualGetters();
  const { nodeData, edgeData, nodeFields, edgeFields } = useGraphDataset();
  const { dynamicNodeData, dynamicEdgeData } = useDynamicItemData();
  const graph = useFilteredGraph();
  const { matchingItems, otherItems } = useMemo(() => {
    let matchingItems: string[] = [];
    const otherItems: string[] = [];

    const allIDs = type === "nodes" ? graph.nodes() : graph.edges();
    const data = type === "nodes" ? nodeData : edgeData;
    const dynamicData = type === "nodes" ? dynamicNodeData : dynamicEdgeData;
    const allData = mergeStaticDynamicData(data, dynamicData);
    const getLabel = type === "nodes" ? getNodeLabel : getEdgeLabel;
    const fields = type === "nodes" ? nodeFields : edgeFields;
    if (search) {
      allIDs.forEach((id) => {
        const label = getLabel?.(allData[id]);
        if (doesItemMatch(id, label, data[id], fields, search)) {
          matchingItems.push(id);
        } else {
          otherItems.push(id);
        }
      });
    } else {
      matchingItems = allIDs;
    }

    return { matchingItems, otherItems };
  }, [
    type,
    graph,
    nodeData,
    edgeData,
    dynamicNodeData,
    dynamicEdgeData,
    getNodeLabel,
    getEdgeLabel,
    nodeFields,
    edgeFields,
    search,
  ]);

  const [selectedTool, setSelectedTool] = useState<undefined | { id: string; panel: Panel }>(undefined);

  // Mobile display:
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setType(inputType);
  }, [inputType, setType]);

  useEffect(() => {
    setExpanded(false);
  }, [items]);

  return (
    <>
      <Header>
        <div className="d-sm-none">
          <button
            className="gl-btn gl-btn-icon"
            onClick={() => (selectedTool ? setSelectedTool(undefined) : setExpanded((v) => !v))}
          >
            {selectedTool ? <MenuPreviousIcon /> : expanded ? <MenuCollapseIcon /> : <MenuExpandIcon />}
          </button>
        </div>
      </Header>
      <Layout id="data-page" className="panels-layout">
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
              <selectedTool.panel close={() => setSelectedTool(undefined)} />
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
                  <Panel borderBottom>
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
      </Layout>
    </>
  );
};
