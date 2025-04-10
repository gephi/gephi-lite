import { FC, useEffect, useMemo } from "react";

import { ItemType } from "../../core/types";
import { Attribute } from "../GraphPartitioning/GraphPartitioningForm";
import { Select } from "./Select";

type AttributeSelectProps = {
  id?: string;
  itemType: ItemType;
  attributeId: string | undefined;
  onChange: (v: string | undefined) => void;
  attributesFilter?: (a: Attribute) => boolean;
  disabled?: boolean;
  defaultToFirstAttribute?: boolean;
  emptyOptionLabel?: string;
};

export const AttributeSelect: FC<AttributeSelectProps> = ({
  id,
  attributeId,
  onChange,
  itemType,
  attributesFilter = () => true,
  disabled,
  defaultToFirstAttribute,
  emptyOptionLabel,
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
  const attributes = (itemType === "nodes" ? nodeAttributes : edgeAttributes).filter(attributesFilter);

  useEffect(() => {
    if (defaultToFirstAttribute && !attributeId) onChange(attributes[0]?.id);
  }, [defaultToFirstAttribute, attributeId, onChange, attributes]);

  const options = useMemo(() => {
    return [
      ...(emptyOptionLabel ? [{ value: "", label: "" }] : []),
      ...attributes.map((a) => ({
        value: a.id,
        label: a.id,
      })),
    ];
  }, [attributes, emptyOptionLabel]);

  return (
    <Select
      id={id}
      isDisabled={disabled}
      className="form-select"
      value={{ value: attributeId || "", label: attributeId || "" }}
      options={options}
      onChange={(e) => onChange(e ? e.value : undefined)}
    />
  );
};
