import cx from "classnames";
import { CSSProperties, FC } from "react";
import { useTranslation } from "react-i18next";

export const Spinner: FC<{ className?: string; style?: CSSProperties }> = ({ className, style }) => {
  const { t } = useTranslation();
  return (
    <div className={cx("spinner-border", className)} style={style} role="status">
      <span className="visually-hidden">{t("common.loading").toString()}...</span>
    </div>
  );
};

/**
 * Display a loader that takes the full screen size.
 */
export const Loader: FC = () => (
  <div className="loader">
    <Spinner style={{ width: "3rem", height: " 3rem" }} />
  </div>
);

/**
 * Display a loader that takes the size of its parent container.
 */
export const LoaderFill: FC = () => (
  <div className="loader-fill">
    <Spinner style={{ width: "3rem", height: " 3rem" }} />
  </div>
);
