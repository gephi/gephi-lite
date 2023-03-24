import { FC, ReactNode } from "react";
import cx from "classnames";

export const NodeComponent: FC<{ label: ReactNode; color: string; hidden?: boolean }> = ({ label, color, hidden }) => {
  return (
    <>
      <span className={hidden ? "circle" : "disc"} style={{ backgroundColor: color }} />{" "}
      <span className={cx(hidden && "text-muted")}>{label}</span>
    </>
  );
};
