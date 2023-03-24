import cx from "classnames";
import { FC, ReactNode } from "react";

import { NodeComponent } from "./Node";

export const EdgeComponent: FC<{
  source: { label: ReactNode; color: string; hidden?: boolean };
  target: { label: ReactNode; color: string; hidden?: boolean };
  label: ReactNode;
  color: string;
  hidden?: boolean;
}> = ({ label, color, source, target, hidden }) => {
  return (
    <div className="d-flex flex-column">
      <div className="text-ellipsis">
        <NodeComponent {...source} />
      </div>
      <div>
        <span className={cx(hidden ? "dotted" : "dash")} style={{ borderColor: color }} />{" "}
        {label && <span className={cx(hidden && "text-muted")}>{label}</span>}
      </div>
      <div className="text-ellipsis">
        <NodeComponent {...target} />
      </div>
    </div>
  );
};
