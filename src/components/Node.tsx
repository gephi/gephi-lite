import { FC, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import cx from "classnames";

export const NodeComponent: FC<{ label: ReactNode; color: string; hidden?: boolean }> = ({ label, color, hidden }) => {
  const { t } = useTranslation();
  return (
    <>
      <span className={hidden ? "circle" : "disc"} style={{ backgroundColor: color }} />{" "}
      <span className={cx(hidden && "text-muted", !label && "fst-italic")}>
        {label || t("selection.node_no_label")}
      </span>
    </>
  );
};
