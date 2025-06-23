import { ItemType } from "@gephi/gephi-lite-sdk";
import { FC, useMemo, useState } from "react";

import { useFilteredGraph, useGraphDataset } from "../../core/context/dataContexts";
import { doesItemMatch } from "../../utils/search";
import { Layout } from "../layout";
import { DataTable } from "./DataTable";
import { TopBar } from "./TopBar";

export const DataPage: FC = () => {
  const { nodeData, edgeData, nodeRenderingData, edgeRenderingData, nodeFields, edgeFields } = useGraphDataset();
  const graph = useFilteredGraph();
  const [{ type, search }, setState] = useState<{ type: ItemType; search: string }>({
    type: "nodes",
    search: "",
  });
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
  }, [edgeData, edgeFields, edgeRenderingData, graph, nodeData, nodeFields, nodeRenderingData, search, type]);

  return (
    <Layout>
      <div id="data-page" className="d-flex flex-column">
        <TopBar type={type} search={search} onSearchChange={(search) => setState((state) => ({ ...state, search }))} />
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
