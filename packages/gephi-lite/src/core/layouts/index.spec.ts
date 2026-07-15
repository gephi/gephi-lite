/**
 * Layout orchestration tests:
 *
 * index.ts has side effects (atoms, bindEffect) that run at import time, so
 * every external dependency is replaced via vi.mock. The mock objects are
 * created in vi.hoisted so they're available inside the vi.mock factories.
 *
 * - Atoms (graphDatasetAtom, sigmaGraphAtom, …) are stubs with a .get() spy
 *   configured per-test via mockReturnValue.
 * - LAYOUTS is a mutable array: tests push the layouts they need, and
 *   beforeEach empties it.
 * - MockSupervisorClass records every instance so tests can inspect which
 *   graph was passed and whether start/stop/kill were called.
 * - testEmitter replaces the real event emitter, letting tests trigger
 *   graphImported / nodesDragged events directly.
 */
import { VisualGetters } from "@gephi/gephi-lite-sdk";
import { MultiGraph } from "graphology";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DynamicItemData, GraphDataset, SigmaGraph } from "../graph/types";
import { buildLayoutGraph, createLayoutSupervisor, layoutStateAtom, startLayout } from "./index";
import { ContinuousLayoutSupervisorConstructor, ContinuousLayoutSupervisorInterface, Layout } from "./types";

const {
  testEmitter,
  EVENTS,
  mockGraphDatasetAtom,
  mockSigmaGraphAtom,
  mockVisualGettersAtom,
  mockFilteredGraphAtom,
  mockDynamicItemDataAtom,
  mockSetNodePositions,
  mockDataGraphToFullGraph,
  mockResetCamera,
  mockConnectedCloseness,
  mockSessionAtom,
  MOCK_LAYOUTS,
} = vi.hoisted(() => {
  type Listener = (...args: unknown[]) => void;
  const listeners: Record<string, Listener[]> = {};
  const testEmitter = {
    on(event: string, fn: Listener) {
      (listeners[event] ??= []).push(fn);
    },
    off(event: string, fn: Listener) {
      listeners[event] = (listeners[event] || []).filter((f) => f !== fn);
    },
    emit(event: string, ...args: unknown[]) {
      for (const fn of listeners[event] || []) fn(...args);
    },
  };

  const EVENTS = {
    sigmaMounted: "sigmaMounted",
    graphImported: "graphImported",
    nodesDragged: "nodesDragged",
    focusNodes: "focusNodes",
    nodeCreated: "nodeCreated",
    edgeCreated: "edgeCreated",
    searchResultsSelected: "searchResultsSelected",
    openMenu: "openMenu",
  } as const;

  const fn = () => ({ get: vi.fn() });
  return {
    testEmitter,
    EVENTS,
    mockGraphDatasetAtom: fn(),
    mockSigmaGraphAtom: fn(),
    mockVisualGettersAtom: fn(),
    mockFilteredGraphAtom: fn(),
    mockDynamicItemDataAtom: fn(),
    mockSetNodePositions: vi.fn(),
    mockDataGraphToFullGraph: vi.fn(),
    mockResetCamera: vi.fn(),
    mockConnectedCloseness: vi.fn(),
    mockSessionAtom: fn(),
    MOCK_LAYOUTS: [] as Layout[],
  };
});

vi.mock("../../utils/storage", () => ({ localStorage: { getItem: () => null } }));
vi.mock("../context/eventsContext", () => ({
  EVENTS,
  emitter: testEmitter,
}));
vi.mock("../graph", () => ({
  graphDatasetAtom: mockGraphDatasetAtom,
  sigmaGraphAtom: mockSigmaGraphAtom,
  visualGettersAtom: mockVisualGettersAtom,
  filteredGraphAtom: mockFilteredGraphAtom,
  dynamicItemDataAtom: mockDynamicItemDataAtom,
  graphDatasetActions: { setNodePositions: mockSetNodePositions },
}));
vi.mock("../graph/utils", () => ({
  dataGraphToFullGraph: mockDataGraphToFullGraph,
}));
vi.mock("../session", () => ({
  sessionAtom: mockSessionAtom,
}));
vi.mock("../sigma", () => ({
  resetCamera: mockResetCamera,
}));
vi.mock("./collection", () => ({
  get LAYOUTS() {
    return MOCK_LAYOUTS;
  },
}));

vi.mock("graphology-metrics/layout-quality", () => ({
  connectedCloseness: mockConnectedCloseness,
}));

// Helpers
// -------
const emptyDynamicData: DynamicItemData = {
  dynamicNodeData: {},
  dynamicNodeFields: [],
  dynamicEdgeData: {},
  dynamicEdgeFields: [],
};

const nullGetters: VisualGetters = {
  getNodeSize: null,
  getNodeColor: null,
  getNodeLabel: null,
  getNodeImage: null,
  getNodePosition: null,
  reverseNodePosition: null,
  getEdgeSize: null,
  getEdgeColor: null,
  getEdgeLabel: null,
  getEdgeZIndex: null,
};

function makeDataset(
  positions: Record<string, { x: number; y: number }>,
  edges?: Array<[string, string]>,
): GraphDataset {
  const fullGraph = new MultiGraph();
  const nodeData: Record<string, Record<string, unknown>> = {};
  for (const id of Object.keys(positions)) {
    fullGraph.addNode(id);
    nodeData[id] = {};
  }
  for (const [s, t] of edges || []) fullGraph.addEdge(s, t);
  return {
    fullGraph,
    layout: positions,
    nodeData,
    edgeData: {},
    metadata: {},
    nodeFields: [],
    edgeFields: [],
  } as unknown as GraphDataset;
}

function makeSigmaGraph(nodes: Record<string, Record<string, unknown>>): MultiGraph {
  const g = new MultiGraph();
  for (const [id, attrs] of Object.entries(nodes)) g.addNode(id, attrs);
  return g;
}

function makeFilteredGraph(nodeIds: string[], edges?: Array<[string, string]>): MultiGraph {
  const g = new MultiGraph();
  for (const id of nodeIds) g.addNode(id);
  for (const [s, t] of edges || []) g.addEdge(s, t);
  return g;
}

// Mock supervisor factory - captures constructor args
let supervisorInstances: {
  graph: MultiGraph;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  kill: ReturnType<typeof vi.fn>;
  isRunning: ReturnType<typeof vi.fn>;
}[] = [];

function MockSupervisorClass(graph: MultiGraph) {
  const inst = {
    graph,
    start: vi.fn(),
    stop: vi.fn(),
    kill: vi.fn(),
    isRunning: vi.fn(() => true),
  };
  supervisorInstances.push(inst);
  return inst as unknown as ContinuousLayoutSupervisorInterface;
}

// Mock transforms (2x scale)
const getNodePosition = ({ x, y }: { x: number; y: number }) => ({ x: x * 2, y: y * 2 });
const reverseNodePosition = ({ x, y }: { x: number; y: number }) => ({ x: x / 2, y: y / 2 });

// Setup / teardown
// ----------------
beforeEach(() => {
  vi.useFakeTimers();
  MOCK_LAYOUTS.length = 0;
  supervisorInstances = [];
  layoutStateAtom.set({ quality: { enabled: false, showGrid: true }, type: "idle" });

  // Default mock returns
  mockVisualGettersAtom.get.mockReturnValue(nullGetters);
  mockDynamicItemDataAtom.get.mockReturnValue(emptyDynamicData);
  mockSessionAtom.get.mockReturnValue({ layoutsParameters: {} });
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

// Tests
// -----
describe("Layout orchestration", () => {
  it("one-shot layout saves positions from run() directly", async () => {
    const dataset = makeDataset({ a: { x: 1, y: 2 } });
    mockGraphDatasetAtom.get.mockReturnValue(dataset);

    const fullGraph = new MultiGraph();
    fullGraph.addNode("a", { x: 1, y: 2 });
    mockDataGraphToFullGraph.mockReturnValue(fullGraph);

    const positions = { a: { x: 10, y: 20 } };
    MOCK_LAYOUTS.push({
      id: "test-oneshot",
      type: "oneshot",
      parameters: [],
      run: () => positions,
    });

    await startLayout("test-oneshot", {});

    expect(mockSetNodePositions).toHaveBeenCalledWith(positions);
  });

  it("on restart, dragged node is reverse-transformed from sigma", async () => {
    const dataset = makeDataset({ a: { x: 5, y: 10 } });
    const sigmaGraph = makeSigmaGraph({ a: { x: 20, y: 40, dragging: true } });
    const filteredGraph = makeFilteredGraph(["a"]);

    mockGraphDatasetAtom.get.mockReturnValue(dataset);
    mockSigmaGraphAtom.get.mockReturnValue(sigmaGraph);
    mockFilteredGraphAtom.get.mockReturnValue(filteredGraph);
    mockVisualGettersAtom.get.mockReturnValue({
      ...nullGetters,
      getNodePosition,
      reverseNodePosition,
    });

    MOCK_LAYOUTS.push({
      id: "test-continuous",
      type: "continuous",
      parameters: [],
      supervisor: MockSupervisorClass as never,
    });

    await startLayout("test-continuous", {}, true);

    expect(supervisorInstances).toHaveLength(1);
    const shadow = supervisorInstances[0].graph;
    expect(shadow.getNodeAttributes("a")).toEqual(expect.objectContaining({ x: 10, y: 20, fixed: true }));
  });

  it("continuous layout graph in graph space; syncToSigma transforms to rendering space", async () => {
    const dataset = makeDataset({ a: { x: 5, y: 10 } });
    const sigmaGraph = makeSigmaGraph({ a: { x: 0, y: 0 } });
    const filteredGraph = makeFilteredGraph(["a"]);

    mockGraphDatasetAtom.get.mockReturnValue(dataset);
    mockSigmaGraphAtom.get.mockReturnValue(sigmaGraph);
    mockFilteredGraphAtom.get.mockReturnValue(filteredGraph);
    mockVisualGettersAtom.get.mockReturnValue({
      ...nullGetters,
      getNodePosition,
    });

    MOCK_LAYOUTS.push({
      id: "test-continuous",
      type: "continuous",
      parameters: [],
      supervisor: MockSupervisorClass as never,
    });

    await startLayout("test-continuous", {});

    const shadow = supervisorInstances[0].graph;
    // Shadow built from dataset (graph space)
    expect(shadow.getNodeAttributes("a")).toEqual(expect.objectContaining({ x: 5, y: 10 }));

    // Mutate shadow and trigger sync
    shadow.setNodeAttribute("a", "x", 15);
    shadow.setNodeAttribute("a", "y", 25);
    shadow.emit("eachNodeAttributesUpdated", { hints: {} });

    // Sigma graph should have transformed coords (2x)
    expect(sigmaGraph.getNodeAttribute("a", "x")).toBe(30);
    expect(sigmaGraph.getNodeAttribute("a", "y")).toBe(50);
  });

  it("dataset change (graphImported) restarts continuous layout", async () => {
    const dataset = makeDataset({ a: { x: 1, y: 2 } });
    const sigmaGraph = makeSigmaGraph({ a: { x: 1, y: 2 } });
    const filteredGraph = makeFilteredGraph(["a"]);

    mockGraphDatasetAtom.get.mockReturnValue(dataset);
    mockSigmaGraphAtom.get.mockReturnValue(sigmaGraph);
    mockFilteredGraphAtom.get.mockReturnValue(filteredGraph);

    MOCK_LAYOUTS.push({
      id: "test-continuous",
      type: "continuous",
      parameters: [],
      supervisor: MockSupervisorClass as never,
    });

    await startLayout("test-continuous", {});
    expect(supervisorInstances).toHaveLength(1);
    const supA = supervisorInstances[0];

    // Simulate session storing last layout
    mockSessionAtom.get.mockReturnValue({
      lastLayout: "test-continuous",
      layoutsParameters: { "test-continuous": {} },
    });

    // Emit graphImported — debounce fires leading edge synchronously
    testEmitter.emit(EVENTS.graphImported);
    await vi.advanceTimersByTimeAsync(0);

    expect(supA.stop).toHaveBeenCalled();
    expect(supA.kill).toHaveBeenCalled();
    expect(supervisorInstances).toHaveLength(2);
    expect(supervisorInstances[1].start).toHaveBeenCalled();
  });

  it("filter change (graphImported) restarts with only filtered nodes", async () => {
    const dataset = makeDataset({ a: { x: 1, y: 2 }, b: { x: 3, y: 4 } });
    const sigmaGraph = makeSigmaGraph({ a: { x: 1, y: 2 }, b: { x: 3, y: 4 } });
    const filteredGraph = makeFilteredGraph(["a", "b"]);

    mockGraphDatasetAtom.get.mockReturnValue(dataset);
    mockSigmaGraphAtom.get.mockReturnValue(sigmaGraph);
    mockFilteredGraphAtom.get.mockReturnValue(filteredGraph);

    MOCK_LAYOUTS.push({
      id: "test-continuous",
      type: "continuous",
      parameters: [],
      supervisor: MockSupervisorClass as never,
    });

    await startLayout("test-continuous", {});

    // First layout graph has both nodes
    expect(supervisorInstances[0].graph.nodes()).toEqual(["a", "b"]);

    mockSessionAtom.get.mockReturnValue({
      lastLayout: "test-continuous",
      layoutsParameters: { "test-continuous": {} },
    });

    // Simulate a filter that removes node "b"
    mockFilteredGraphAtom.get.mockReturnValue(makeFilteredGraph(["a"]));
    testEmitter.emit(EVENTS.graphImported);
    await vi.advanceTimersByTimeAsync(0);

    // Restarted layout graph only has the filtered node
    expect(supervisorInstances).toHaveLength(2);
    expect(supervisorInstances[1].graph.nodes()).toEqual(["a"]);
  });

  it("starting another continuous stops the previous one", async () => {
    const dataset = makeDataset({ a: { x: 1, y: 2 } });
    const sigmaGraph = makeSigmaGraph({ a: { x: 1, y: 2 } });
    const filteredGraph = makeFilteredGraph(["a"]);

    mockGraphDatasetAtom.get.mockReturnValue(dataset);
    mockSigmaGraphAtom.get.mockReturnValue(sigmaGraph);
    mockFilteredGraphAtom.get.mockReturnValue(filteredGraph);

    MOCK_LAYOUTS.push({
      id: "continuous-a",
      type: "continuous",
      parameters: [],
      supervisor: MockSupervisorClass as never,
    });
    MOCK_LAYOUTS.push({
      id: "continuous-b",
      type: "continuous",
      parameters: [],
      supervisor: MockSupervisorClass as never,
    });

    await startLayout("continuous-a", {});
    const supA = supervisorInstances[0];

    await startLayout("continuous-b", {});

    expect(supA.stop).toHaveBeenCalled();
    expect(supA.kill).toHaveBeenCalled();
    expect(supervisorInstances).toHaveLength(2);
    expect(supervisorInstances[1].start).toHaveBeenCalled();
  });

  it("one-shot layout during continuous: saves positions, continuous restarts via graphImported", async () => {
    const dataset = makeDataset({ a: { x: 1, y: 2 } });
    const sigmaGraph = makeSigmaGraph({ a: { x: 1, y: 2 } });
    const filteredGraph = makeFilteredGraph(["a"]);

    mockGraphDatasetAtom.get.mockReturnValue(dataset);
    mockSigmaGraphAtom.get.mockReturnValue(sigmaGraph);
    mockFilteredGraphAtom.get.mockReturnValue(filteredGraph);

    const fullGraph = new MultiGraph();
    fullGraph.addNode("a", { x: 1, y: 2 });
    mockDataGraphToFullGraph.mockReturnValue(fullGraph);

    MOCK_LAYOUTS.push({
      id: "test-continuous",
      type: "continuous",
      parameters: [],
      supervisor: MockSupervisorClass as never,
    });
    MOCK_LAYOUTS.push({
      id: "test-oneshot",
      type: "oneshot",
      parameters: [],
      run: () => ({ a: { x: 99, y: 99 } }),
    });

    // Start continuous
    await startLayout("test-continuous", {});
    const supA = supervisorInstances[0];

    // Run one-shot layout — stops the continuous
    await startLayout("test-oneshot", {});
    expect(supA.stop).toHaveBeenCalled();
    expect(supA.kill).toHaveBeenCalled();
    expect(mockSetNodePositions).toHaveBeenCalledWith({ a: { x: 99, y: 99 } });

    // Simulate restart via graphImported
    mockSessionAtom.get.mockReturnValue({
      lastLayout: "test-continuous",
      layoutsParameters: { "test-continuous": {} },
    });
    testEmitter.emit(EVENTS.graphImported);
    await vi.advanceTimersByTimeAsync(0);

    expect(supervisorInstances).toHaveLength(2);
    expect(supervisorInstances[1].start).toHaveBeenCalled();
  });
});

// Unit tests for exported pure functions
// ---------------------------------------
// These don't need the vi.mock infrastructure — they operate on real graphs.

function buildArgs(
  overrides: Partial<Parameters<typeof buildLayoutGraph>[0]> = {},
): Parameters<typeof buildLayoutGraph>[0] {
  const sigmaGraph = new MultiGraph() as SigmaGraph;
  return {
    dataset: {
      fullGraph: new MultiGraph(),
      layout: {},
      nodeData: {},
      edgeData: {},
      metadata: {},
      nodeFields: [],
      edgeFields: [],
    } as unknown as GraphDataset,
    filteredGraph: new MultiGraph(),
    visualGetters: nullGetters,
    dynamicItemData: emptyDynamicData,
    sigmaGraph,
    params: {},
    useSigmaPositions: false,
    ...overrides,
  };
}

describe("buildLayoutGraph", () => {
  it("reads positions from dataset when useSigmaPositions is false", () => {
    const filteredGraph = makeFilteredGraph(["a", "b"]);
    const result = buildLayoutGraph(
      buildArgs({
        dataset: makeDataset({ a: { x: 1, y: 2 }, b: { x: 3, y: 4 } }),
        filteredGraph,
        sigmaGraph: makeSigmaGraph({ a: { x: 99, y: 99 }, b: { x: 99, y: 99 } }) as SigmaGraph,
      }),
    );
    expect(result.getNodeAttributes("a")).toEqual(expect.objectContaining({ x: 1, y: 2 }));
    expect(result.getNodeAttributes("b")).toEqual(expect.objectContaining({ x: 3, y: 4 }));
  });

  it("reads positions from sigma and reverse-transforms when useSigmaPositions is true", () => {
    const filteredGraph = makeFilteredGraph(["a"]);
    const result = buildLayoutGraph(
      buildArgs({
        dataset: makeDataset({ a: { x: 0, y: 0 } }),
        filteredGraph,
        sigmaGraph: makeSigmaGraph({ a: { x: 20, y: 40 } }) as SigmaGraph,
        visualGetters: { ...nullGetters, reverseNodePosition },
        useSigmaPositions: true,
      }),
    );
    expect(result.getNodeAttributes("a")).toEqual(expect.objectContaining({ x: 10, y: 20 }));
  });

  it("reads raw sigma positions when useSigmaPositions is true without reverseNodePosition", () => {
    const filteredGraph = makeFilteredGraph(["a"]);
    const result = buildLayoutGraph(
      buildArgs({
        dataset: makeDataset({ a: { x: 0, y: 0 } }),
        filteredGraph,
        sigmaGraph: makeSigmaGraph({ a: { x: 7, y: 9 } }) as SigmaGraph,
        useSigmaPositions: true,
      }),
    );
    expect(result.getNodeAttributes("a")).toEqual(expect.objectContaining({ x: 7, y: 9 }));
  });

  it("marks node fixed when dragging is true in sigma", () => {
    const filteredGraph = makeFilteredGraph(["a", "b"]);
    const result = buildLayoutGraph(
      buildArgs({
        dataset: makeDataset({ a: { x: 0, y: 0 }, b: { x: 1, y: 1 } }),
        filteredGraph,
        sigmaGraph: makeSigmaGraph({ a: { x: 0, y: 0, dragging: true }, b: { x: 1, y: 1 } }) as SigmaGraph,
      }),
    );
    expect(result.getNodeAttribute("a", "fixed")).toBe(true);
    expect(result.getNodeAttribute("b", "fixed")).toBe(false);
  });

  it("marks node fixed via getNodeFixedAttribut param", () => {
    const dataset = makeDataset({ a: { x: 0, y: 0 }, b: { x: 1, y: 1 } });
    dataset.nodeData["a"] = { pinned: true };
    dataset.nodeData["b"] = { pinned: false };
    const filteredGraph = makeFilteredGraph(["a", "b"]);
    const result = buildLayoutGraph(
      buildArgs({
        dataset,
        filteredGraph,
        sigmaGraph: makeSigmaGraph({ a: { x: 0, y: 0 }, b: { x: 1, y: 1 } }) as SigmaGraph,
        params: { getNodeFixedAttribut: "pinned" },
      }),
    );
    expect(result.getNodeAttribute("a", "fixed")).toBe(true);
    expect(result.getNodeAttribute("b", "fixed")).toBe(false);
  });

  it("uses getNodeSize for size, falls back to DEFAULT_NODE_SIZE", () => {
    const filteredGraph = makeFilteredGraph(["a", "b"]);
    const customSize = vi.fn(() => 42);
    const result = buildLayoutGraph(
      buildArgs({
        dataset: makeDataset({ a: { x: 0, y: 0 }, b: { x: 1, y: 1 } }),
        filteredGraph,
        sigmaGraph: makeSigmaGraph({ a: { x: 0, y: 0 }, b: { x: 1, y: 1 } }) as SigmaGraph,
        visualGetters: { ...nullGetters, getNodeSize: customSize },
      }),
    );
    expect(result.getNodeAttribute("a", "size")).toBe(42);
    // Without getNodeSize, falls back to default
    const result2 = buildLayoutGraph(
      buildArgs({
        dataset: makeDataset({ a: { x: 0, y: 0 } }),
        filteredGraph: makeFilteredGraph(["a"]),
        sigmaGraph: makeSigmaGraph({ a: { x: 0, y: 0 } }) as SigmaGraph,
      }),
    );
    expect(result2.getNodeAttribute("a", "size")).toBe(20);
  });

  it("preserves edge direction and computes weight", () => {
    const filtered = new MultiGraph();
    filtered.addNode("a");
    filtered.addNode("b");
    const dirKey = filtered.addDirectedEdge("a", "b");
    const undirKey = filtered.addUndirectedEdge("b", "a");

    const dataset = makeDataset({ a: { x: 0, y: 0 }, b: { x: 1, y: 1 } });
    dataset.edgeData[dirKey] = {};
    dataset.edgeData[undirKey] = {};

    const customWeight = vi.fn(() => 5);
    const result = buildLayoutGraph(
      buildArgs({
        dataset,
        filteredGraph: filtered,
        sigmaGraph: makeSigmaGraph({ a: { x: 0, y: 0 }, b: { x: 1, y: 1 } }) as SigmaGraph,
        visualGetters: { ...nullGetters, getEdgeSize: customWeight },
      }),
    );

    expect(result.isDirected(dirKey)).toBe(true);
    expect(result.isUndirected(undirKey)).toBe(true);
    expect(result.getEdgeAttribute(dirKey, "weight")).toBe(5);
    expect(result.getEdgeAttribute(undirKey, "weight")).toBe(5);
  });

  it("defaults edge weight to DEFAULT_EDGE_SIZE without getEdgeSize", () => {
    const filtered = new MultiGraph();
    filtered.addNode("a");
    filtered.addNode("b");
    const eKey = filtered.addEdge("a", "b");

    const dataset = makeDataset({ a: { x: 0, y: 0 }, b: { x: 1, y: 1 } });
    dataset.edgeData[eKey] = {};

    const result = buildLayoutGraph(
      buildArgs({
        dataset,
        filteredGraph: filtered,
        sigmaGraph: makeSigmaGraph({ a: { x: 0, y: 0 }, b: { x: 1, y: 1 } }) as SigmaGraph,
      }),
    );
    expect(result.getEdgeAttribute(eKey, "weight")).toBe(6);
  });
});

describe("createLayoutSupervisor", () => {
  it("getPositions returns current layout graph positions", () => {
    const layoutGraph = new MultiGraph();
    layoutGraph.addNode("a", { x: 10, y: 20 });
    layoutGraph.addNode("b", { x: 30, y: 40 });
    const sigmaGraph = makeSigmaGraph({ a: { x: 0, y: 0 }, b: { x: 0, y: 0 } });

    const { getPositions } = createLayoutSupervisor(
      MockSupervisorClass as unknown as ContinuousLayoutSupervisorConstructor,
      layoutGraph,
      sigmaGraph,
      {},
    );
    expect(getPositions()).toEqual({ a: { x: 10, y: 20 }, b: { x: 30, y: 40 } });
  });

  it("syncToSigma copies positions without transform", () => {
    const layoutGraph = new MultiGraph();
    layoutGraph.addNode("a", { x: 5, y: 10 });
    const sigmaGraph = makeSigmaGraph({ a: { x: 0, y: 0 } });

    createLayoutSupervisor(
      MockSupervisorClass as unknown as ContinuousLayoutSupervisorConstructor,
      layoutGraph,
      sigmaGraph,
      {},
    );
    layoutGraph.emit("eachNodeAttributesUpdated", { hints: {} });

    expect(sigmaGraph.getNodeAttribute("a", "x")).toBe(5);
    expect(sigmaGraph.getNodeAttribute("a", "y")).toBe(10);
  });

  it("syncToSigma applies toSigma transform", () => {
    const layoutGraph = new MultiGraph();
    layoutGraph.addNode("a", { x: 5, y: 10 });
    const sigmaGraph = makeSigmaGraph({ a: { x: 0, y: 0 } });

    createLayoutSupervisor(
      MockSupervisorClass as unknown as ContinuousLayoutSupervisorConstructor,
      layoutGraph,
      sigmaGraph,
      {},
      getNodePosition,
    );
    layoutGraph.emit("eachNodeAttributesUpdated", { hints: {} });

    expect(sigmaGraph.getNodeAttribute("a", "x")).toBe(10);
    expect(sigmaGraph.getNodeAttribute("a", "y")).toBe(20);
  });

  it("syncToSigma skips nodes not in layout graph", () => {
    const layoutGraph = new MultiGraph();
    layoutGraph.addNode("a", { x: 5, y: 10 });
    const sigmaGraph = makeSigmaGraph({ a: { x: 0, y: 0 }, b: { x: 77, y: 88 } });

    createLayoutSupervisor(
      MockSupervisorClass as unknown as ContinuousLayoutSupervisorConstructor,
      layoutGraph,
      sigmaGraph,
      {},
    );
    layoutGraph.emit("eachNodeAttributesUpdated", { hints: {} });

    expect(sigmaGraph.getNodeAttribute("b", "x")).toBe(77);
    expect(sigmaGraph.getNodeAttribute("b", "y")).toBe(88);
  });

  it("kill unsubscribes syncToSigma listener", () => {
    const layoutGraph = new MultiGraph();
    layoutGraph.addNode("a", { x: 5, y: 10 });
    const sigmaGraph = makeSigmaGraph({ a: { x: 0, y: 0 } });

    const { supervisor } = createLayoutSupervisor(
      MockSupervisorClass as unknown as ContinuousLayoutSupervisorConstructor,
      layoutGraph,
      sigmaGraph,
      {},
    );
    supervisor.kill();

    // After kill, sync event should have no effect
    layoutGraph.setNodeAttribute("a", "x", 99);
    layoutGraph.emit("eachNodeAttributesUpdated", { hints: {} });
    expect(sigmaGraph.getNodeAttribute("a", "x")).toBe(0);
  });
});
