import { FC, useEffect } from "react";
import { Attribute } from "../GraphPartitioning/GraphPartitioningForm";
import { NodeEdgeProps } from "./NodeEdgeTabs";

type AttributeSelectProps = NodeEdgeProps & {
  id?: string;
  attributeId: string | undefined;
  onChange: (v: string | undefined) => void;
  attributesFilter?: (a: Attribute) => boolean;
  disabled?: boolean;
  defaultToFirstAttribute?: boolean;
};

export const AttributeSelect: FC<AttributeSelectProps> = ({
  id,
  attributeId,
  onChange,
  nodeEdge,
  attributesFilter = () => true,
  disabled,
  defaultToFirstAttribute,
}) => {
  //TODO: replace by core.model types once done

  const nodeAttributes: Attribute[] = [
    { id: "att_dual", qualitative: true, quantitative: true },
    { id: "att_quanti", qualitative: false, quantitative: true },
    { id: "att_quali", qualitative: true, quantitative: false },
    { id: "att_color", qualitative: true, quantitative: false },
    { id: "att_partial_fail_color", qualitative: true, quantitative: false },
  ];
  const edgeAttributes: Attribute[] = [
    { id: "weight", qualitative: false, quantitative: true },
    { id: "type", qualitative: true, quantitative: false },
  ];
  const attributes = (nodeEdge === "nodes" ? nodeAttributes : edgeAttributes).filter(attributesFilter);

  useEffect(() => {
    if (defaultToFirstAttribute && !attributeId) onChange(attributes[0]?.id);
  }, [defaultToFirstAttribute, attributeId, onChange, attributes]);
  return (
    <select
      id={id}
      disabled={disabled}
      className="form-select"
      value={attributeId || ""}
      onChange={(e) => onChange(e.target.value === "" ? undefined : e.target.value)}
    >
      {attributes.map((na) => (
        <option key={na.id} value={na.id}>
          {na.id}
        </option>
      ))}
    </select>
  );
};
