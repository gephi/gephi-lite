import { FC, useMemo } from "react";

import { SizeRankingEditor } from "./SizeRankingEditor";
import { SizeFixedEditor } from "./SizeFixedEditor";
import { ItemType } from "../../../core/types";
import { FieldModel } from "../../../core/graph/types";
import { DEFAULT_EDGE_SIZE, DEFAULT_NODE_SIZE } from "../../../core/appearance/utils";
import { useAppearance, useGraphDataset, useSetSizeAppearance } from "../../../core/context/dataContexts";

export const SizeItem: FC<{ itemType: ItemType }> = ({ itemType }) => {
  const { nodeFields, edgeFields } = useGraphDataset();
  const appearance = useAppearance();
  const setSizeAppearance = useSetSizeAppearance();

  const size = itemType === "nodes" ? appearance.nodesSize : appearance.edgesSize;
  const sizeValue = size.type === "fixed" ? "fixed" : `ranking::${size.field}`;
  const baseValue = itemType === "nodes" ? DEFAULT_NODE_SIZE : DEFAULT_EDGE_SIZE;
  const fields = useMemo(() => {
    const allFields: FieldModel[] = itemType === "nodes" ? nodeFields : edgeFields;
    return allFields.filter((field) => !!field.quantitative);
  }, [edgeFields, itemType, nodeFields]);

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <h3>Size</h3>
      <label htmlFor="sizeMode">Set size from</label>
      <select
        id="sizeMode"
        className="form-select"
        value={sizeValue}
        onChange={(e) => {
          const value = e.target.value;
          if (value === "fixed") {
            if (size.type !== "fixed") {
              setSizeAppearance(itemType, {
                type: "fixed",
                value: baseValue,
              });
            }
          } else if (value === "data") {
            setSizeAppearance(itemType, {
              type: "data",
            });
          } else {
            const field = value.replace(/^ranking::/, "");
            setSizeAppearance(itemType, {
              type: "ranking",
              field,
              minSize: baseValue / 2,
              maxSize: baseValue * 2,
              missingSize: baseValue / 3,
            });
          }
        }}
      >
        <option value="data">sizes from input file</option>
        <option value="fixed">fixed size</option>
        {fields.map((field) => (
          <option key={field.id} value={`ranking::${field.id}`}>
            {field.id}
          </option>
        ))}
      </select>

      {size.type === "fixed" && (
        <SizeFixedEditor itemType={itemType} size={size} setSize={(newSize) => setSizeAppearance(itemType, newSize)} />
      )}
      {size.type === "ranking" && (
        <SizeRankingEditor
          itemType={itemType}
          size={size}
          setSize={(newSize) => setSizeAppearance(itemType, newSize)}
        />
      )}
    </form>
  );
};
