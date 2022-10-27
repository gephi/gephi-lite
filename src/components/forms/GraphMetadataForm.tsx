import { mapValues } from "lodash";
import { FC, useMemo, useState } from "react";

import { graphDatasetActions, graphDatasetAtom } from "../../core/graph";
import { toString } from "../../core/utils/casting";

const GraphTypeValues = ["directed", "undirected", "mixed"] as const;
type GraphType = typeof GraphTypeValues[number];
interface GraphMetadata {
  title?: string;
  authors?: string;
  description?: string;
  type?: GraphType;
}

export const GraphMetadataForm: FC = () => {
  const initialMetadata = useMemo(() => mapValues(graphDatasetAtom.get()["metadata"], toString), []);
  const [graphMetadata, setGraphMetadata] = useState<GraphMetadata>(initialMetadata);

  return (
    <form>
      <div className="mb-2">
        <label htmlFor="graph-title" className="form-label">
          Title
        </label>
        <input
          className="form-control"
          id="graph-title"
          type="text"
          value={graphMetadata?.title || ""}
          onChange={(e) => {
            setGraphMetadata({ ...graphMetadata, title: e.target.value });
          }}
        />
      </div>
      <div className="mb-2">
        <label htmlFor="graph-description" className="form-label">
          Description
        </label>
        <textarea
          className="form-control"
          id="graph-description"
          value={graphMetadata?.description || ""}
          onChange={(e) => {
            setGraphMetadata({
              ...graphMetadata,
              description: e.target.value,
            });
          }}
        />
      </div>
      <div className="mb-2">
        <label htmlFor="graph-authors" className="form-label">
          Authors
        </label>
        <input
          className="form-control"
          id="graph-authors"
          type="text"
          value={graphMetadata?.authors || ""}
          onChange={(e) => {
            setGraphMetadata({ ...graphMetadata, authors: e.target.value });
          }}
        />
      </div>
      <div className="mb-2">
        <label htmlFor="graph-type" className="form-label">
          Edge type
        </label>
        <select
          className="form-select"
          id="graph-type"
          value={graphMetadata?.type || "undirected"}
          onChange={(e) => {
            setGraphMetadata({
              ...graphMetadata,
              type: e.target.value as GraphType,
            });
          }}
        >
          {GraphTypeValues.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>
      <button
        className="btn btn-primary"
        type="submit"
        aria-label="save Graph Metadata"
        disabled={graphMetadata === null}
        onClick={(e) => {
          e.preventDefault();
          graphDatasetActions.setGraphMeta(graphMetadata);
        }}
      >
        save
      </button>
    </form>
  );
};
