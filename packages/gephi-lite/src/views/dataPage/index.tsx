import { FC, useMemo } from "react";

import { useDataTable, useDataTableActions, useFilteredGraph, useGraphDataset } from "../../core/context/dataContexts";
import { doesItemMatch } from "../../utils/search";
import { Layout } from "../layout";
import { DataTable } from "./DataTable";
import { TopBar } from "./TopBar";

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
      <div id="data-page" className="d-flex flex-column">
        <TopBar type={type} search={search} onSearchChange={(query) => updateQuery({ query })} />
        <section className="flex-grow-1 position-relative">
          <DataTable type={type} itemIDs={matchingItems} />
        </section>
        {search && (
          <section className="flex-grow-1 position-relative">
            <DataTable type={type} itemIDs={otherItems} />
          </section>
        )}
      </div>
    </Layout>
  );
};
