import { mapValues, omit } from 'lodash';
import Graph, { MultiGraph } from 'graphology';

import {
  DatalessGraph,
  EdgeRenderingData,
  GraphDataset,
  ItemData,
  NodeRenderingData,
  SigmaGraph,
} from './types';
import { toNumber, toScalar } from '../utils/casting';

export function getRandomNodeCoordinate(): number {
  return Math.random() * 100;
}

export function getEmptyGraphDataset(): GraphDataset {
  return {
    nodeRenderingData: {},
    edgeRenderingData: {},
    nodeData: {},
    edgeData: {},
    metadata: {},
    fullGraph: new MultiGraph<{}, {}>(),
  };
}

/**
 * This function takes any graphology instance (like returned by any graphology
 * importer basically), and returns a properly shaped graph dataset:
 */
export function initializeGraphDataset(graph: Graph): GraphDataset {
  const dataset = getEmptyGraphDataset();

  graph.forEachNode((node, attributes) => {
    const x = toNumber(attributes.x);
    const y = toNumber(attributes.y);

    const renderingData: NodeRenderingData = {
      label: typeof attributes.label === 'string' ? attributes.label : undefined,
      color: typeof attributes.color === 'string' ? attributes.color : undefined,
      size: toNumber(attributes.size),
      x: typeof x === 'number' ? x : getRandomNodeCoordinate(),
      y: typeof y === 'number' ? y : getRandomNodeCoordinate(),
    };

    const nodeData: ItemData = mapValues(
      omit(attributes, 'label', 'color', 'size', 'x', 'y'),
      (v) => toScalar(v)
    );

    dataset.fullGraph.addNode(node, {});
    dataset.nodeRenderingData[node] = renderingData;
    dataset.nodeData[node] = nodeData;
  });

  graph.forEachEdge((edge, attributes, source, target) => {
    const renderingData: EdgeRenderingData = {
      label: typeof attributes.label === 'string' ? attributes.label : undefined,
      color: typeof attributes.color === 'string' ? attributes.color : undefined,
      size: toNumber(attributes.size),
    };

    const edgeData: ItemData = mapValues(
      omit(attributes, 'label', 'color', 'size', 'x', 'y'),
      (v) => toScalar(v)
    );

    dataset.fullGraph.addEdgeWithKey(edge, source, target, {});
    dataset.edgeRenderingData[edge] = renderingData;
    dataset.edgeData[edge] = edgeData;
  });

  return dataset;
}

/**
 * This function takes a graph dataset (and optionally a DatalessGraph as input)
 * and returns a SigmaGraph:
 */
export function dataGraphToSigmaGraph(
  { fullGraph, nodeRenderingData, edgeRenderingData }: GraphDataset,
  graph: DatalessGraph = fullGraph
) {
  const sigmaGraph: SigmaGraph = new MultiGraph<NodeRenderingData, EdgeRenderingData>();
  graph.forEachNode((node) => sigmaGraph.addNode(node, nodeRenderingData[node]));
  graph.forEachEdge((edge, _, source, target) =>
    sigmaGraph.addEdgeWithKey(edge, source, target, edgeRenderingData[edge])
  );
  return sigmaGraph;
}
