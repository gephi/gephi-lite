import Graph from "graphology";
import Papa from "papaparse";

const SOURCE_ALIASES = ["source", "from", "src"];
const TARGET_ALIASES = ["target", "to", "dst", "dest"];

function detectColumn(headers: string[], aliases: string[]): string | null {
  const lower = headers.map((h) => h.toLowerCase().trim());
  for (const alias of aliases) {
    const idx = lower.indexOf(alias);
    if (idx !== -1) return headers[idx];
  }
  return null;
}

/**
 * Parse an edge-list CSV string and return a Graphology Graph instance.
 * Nodes are auto-created from source/target values.
 */
export function parseEdgeListCSV(csvContent: string): Graph {
  const result = Papa.parse<Record<string, unknown>>(csvContent, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  if (result.errors.length > 0 && result.data.length === 0) {
    throw new Error(`CSV parse error: ${result.errors[0].message}`);
  }

  const headers = result.meta.fields;
  if (!headers || headers.length < 2) {
    throw new Error("CSV file must have at least two columns (source and target).");
  }

  let sourceCol = detectColumn(headers, SOURCE_ALIASES);
  let targetCol = detectColumn(headers, TARGET_ALIASES);

  // Fallback: use first two columns
  if (!sourceCol || !targetCol) {
    sourceCol = headers[0];
    targetCol = headers[1];
  }

  if (result.data.length === 0) {
    throw new Error("CSV file contains no data rows.");
  }

  const graph = new Graph({ multi: true });
  const attrCols = headers.filter((h) => h !== sourceCol && h !== targetCol);

  for (const row of result.data) {
    const source = String(row[sourceCol] ?? "").trim();
    const target = String(row[targetCol] ?? "").trim();

    if (!source || !target) continue;

    if (!graph.hasNode(source)) {
      graph.addNode(source, { label: source });
    }
    if (!graph.hasNode(target)) {
      graph.addNode(target, { label: target });
    }

    const attrs: Record<string, unknown> = {};
    for (const col of attrCols) {
      if (row[col] !== null && row[col] !== undefined && row[col] !== "") {
        attrs[col] = row[col];
      }
    }

    graph.addEdge(source, target, attrs);
  }

  if (graph.order === 0) {
    throw new Error("No valid edges found in CSV file.");
  }

  return graph;
}
