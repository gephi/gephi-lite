import { FC } from "react";
import { useTranslation } from "react-i18next";
import cx from "classnames";

const ICON_NAMES = {
  color: {
    node: "icon-node_color",
    edge: "icon-node_link_color",
  },
  size: {
    node: "icon-node_size",
    edge: "icon-node_link_weight",
  },
};

export const CaptionItemTitle: FC<{ itemType: "node" | "edge"; vizVariable: "color" | "size"; field: string }> = ({
  itemType,
  field,
  vizVariable,
}) => {
  const { t } = useTranslation();
  const label = t(`graph.caption.${vizVariable}`, {
    itemType: t(`graph.model.${itemType}s`, { count: 2 }) + "",
  }).toString();

  return (
    <div className="d-flex align-items-center mb-1">
      <i title={label} className={cx("fs-4 me-1", ICON_NAMES[vizVariable][itemType])} />
      <div className="d-flex flex-column justify-content-center m-2">
        <span className="text-muted small">{label}</span>
        <h4 className="fs-5 m-0">{field}</h4>
      </div>
    </div>
  );
};
