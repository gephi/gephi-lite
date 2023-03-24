import Graph from "graphology";

type GraphWithPrivateMembers = Graph & {
  _nodes: Map<string, unknown>;
  _edges: Map<string, unknown>;
  _resetInstanceCounters: () => void;
};

/**
 * This function allows emptying a graphology instance, without triggering the
 * "cleared" event:
 */
export function clearGraph(graph: Graph): void {
  const graphWithPrivateMembers = graph as GraphWithPrivateMembers;
  graphWithPrivateMembers._nodes.clear();
  graphWithPrivateMembers._edges.clear();
  graphWithPrivateMembers._resetInstanceCounters();
}
