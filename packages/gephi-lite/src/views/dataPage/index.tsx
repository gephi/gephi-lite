import cx from "classnames";
import { FC, ReactNode, useEffect, useMemo, useState } from "react";
import { PiCaretDown, PiCaretRight } from "react-icons/pi";
import { ScrollSync } from "react-scroll-sync";

import { useDataTable, useDataTableActions, useFilteredGraph, useGraphDataset } from "../../core/context/dataContexts";
import { doesItemMatch } from "../../utils/search";
import { Layout } from "../layout";
import { DataTable } from "./DataTable";
import { TopBar } from "./TopBar";

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
    </>
  );
};

export const DataPage: FC = () => {
  const { type, search } = useDataTable();
  const { updateQuery } = useDataTableActions();
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

  return (
    <Layout>
      <ScrollSync enabled horizontal vertical={false}>
        <div id="data-page" className="d-flex flex-column">
          <TopBar type={type} search={search} onSearchChange={(query) => updateQuery({ query })} />
          {search ? (
            <>
              <Panel>
                <>
                  <strong>{matchingItems.length}</strong> {type} matching the search query
                </>
                <DataTable type={type} itemIDs={matchingItems} />
              </Panel>
              <Panel collapsed>
                <>
                  <strong>{otherItems.length}</strong> {type} not matching the search query
                </>
                <DataTable type={type} itemIDs={otherItems} />
              </Panel>
            </>
          ) : (
            <section className="flex-grow-1 position-relative">
              <DataTable type={type} itemIDs={matchingItems} />
            </section>
          )}
        </div>
      </ScrollSync>
    </Layout>
  );
};
