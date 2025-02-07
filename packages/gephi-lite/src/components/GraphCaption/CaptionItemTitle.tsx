import { ItemType } from "@gephi/gephi-lite-sdk";
import cx from "classnames";
import { FC } from "react";
import { useTranslation } from "react-i18next";

import { TransformationMethod } from "../../core/appearance/types";

const ICON_NAMES = {
  color: {
    nodes: "icon-node_color",
    edges: "icon-node_link_color",
  },
  size: {
    nodes: "icon-node_size",
    edges: "icon-node_link_weight",
  },
};

const TransformationMethodLabel: FC<{ field: string; transformationMethod?: TransformationMethod }> = ({
  field,
  transformationMethod,
}) => {
  const methodLabelProps = { className: "text-muted", style: { fontSize: "0.75em" } };
  if (!transformationMethod) return <>{field}</>;
  if (transformationMethod === "log")
    return (
      <>
        <span {...methodLabelProps}>log(</span>
        {field}
        <span {...methodLabelProps}>)</span>
      </>
    );
  if ("pow" in transformationMethod) {
    if (transformationMethod.pow === 0.5)
      return (
        <>
          <span {...methodLabelProps}>√(</span>
          {field}
          <span {...methodLabelProps}>)</span>
        </>
      );
    else
      return (
        <>
          {field}
          <sup {...methodLabelProps}>{transformationMethod.pow}</sup>
        </>
      );
  }
  return <>{field}</>;
};

export const CaptionItemTitle: FC<{
  itemType: ItemType;
  vizVariable: "color" | "size";
  field: string;
  transformationMethod?: TransformationMethod;
}> = ({ itemType, field, vizVariable, transformationMethod }) => {
  const { t } = useTranslation();
  const label = t(`graph.caption.${vizVariable}`, {
    itemType: t(`graph.model.${itemType}`, { count: 2 }) + "",
  }).toString();

  return (
    <div className="d-flex align-items-center mb-1">
      <i title={label} className={cx("fs-4 me-1", ICON_NAMES[vizVariable][itemType])} />
      <div className="d-flex flex-column justify-content-center m-2">
        <span className="text-muted caption-item-label">{label}</span>
        <h6 className="m-0 d-flex align-items-center">
          <TransformationMethodLabel field={field} transformationMethod={transformationMethod} />
        </h6>
      </div>
    </div>
  );
};
