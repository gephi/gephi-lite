import { FC, CSSProperties } from "react";
import cx from "classnames";

export const Spinner: FC<{ className?: string; style?: CSSProperties }> = ({ className, style }) => (
  <div className={cx("spinner-border", className)} style={style} role="status">
    <span className="visually-hidden">Loading...</span>
  </div>
);

export const Loader: FC = () => (
  <div className="loader-fill">
    <Spinner style={{ width: "3rem", height: " 3rem" }} />
  </div>
);
