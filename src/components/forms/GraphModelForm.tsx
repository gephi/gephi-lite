import { FC } from "react";
import { Attribute } from "../GraphPartitioning/GraphPartitioningForm";
import { NodeEdgeProps, NodeEdgeTabs } from "./NodeEdgeTabs";

//TODO: replace by core.model types once done

const nodeAttributes: Attribute[] = [
  { id: "att_dual", qualitative: true, quantitative: true },
  { id: "att_quanti", qualitative: false, quantitative: true },
  { id: "att_quali", qualitative: true, quantitative: false },
];
const edgeAttributes: Attribute[] = [{ id: "weight", qualitative: false, quantitative: true }];

const NodeEdgeAttributes: FC<NodeEdgeProps> = ({ nodeEdge }) => {
  const attributes = nodeEdge === "node" ? nodeAttributes : edgeAttributes;
  return (
    <div>
      {attributes.map((a) => (
        <div key={a.id}>
          {a.id}
          <div className="form-check form-check-inline">
            <input
              className="form-check-input"
              type="checkbox"
              id={`${a.id}quali`}
              checked={a.qualitative}
              onChange={(e) => console.log(`TODO: set model in context ${{ ...a, qualitative: e.target.checked }}`)}
            />
            <label className="form-check-label" htmlFor={`${a.id}quali`}>
              quali
            </label>
          </div>
          <div className="form-check form-check-inline">
            <input
              className="form-check-input"
              type="checkbox"
              id={`${a.id}quanti`}
              checked={a.quantitative}
              onChange={(e) => console.log(`TODO: set model in context ${{ ...a, quantitative: e.target.checked }}`)}
            />
            <label className="form-check-label" htmlFor={`${a.id}quanti`}>
              quanti
            </label>
          </div>
        </div>
      ))}
    </div>
  );
};

export const GraphModelForm: FC = () => {
  return (
    <NodeEdgeTabs>
      <NodeEdgeAttributes nodeEdge="node" />
    </NodeEdgeTabs>
  );
};
