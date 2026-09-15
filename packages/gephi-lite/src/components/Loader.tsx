import cx from "classnames";
import { CSSProperties, FC } from "react";
import { useTranslation } from "react-i18next";
import { IconType } from "react-icons";

export const Spinner: FC<{ className?: string; style?: CSSProperties }> = ({ className, style }) => {
  const { t } = useTranslation();
  return (
    <div className={cx("spinner-border", className)} style={style} role="status">
      <span className="visually-hidden">{t("common.loading").toString()}...</span>
    </div>
  );
};

export const SpinnerIcon: FC<{ icon: IconType }> = ({ icon: Icon }) => {
  return (
    <div className="spinner-pause-icon">
      <div className="spinner-border" />
      <Icon className="icon" />
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
export const LoaderFill: FC<{ message?: string }> = ({ message }) => (
  <div className="loader-fill">
    <Spinner style={{ width: "3rem", height: " 3rem" }} />
    {message && <p className="text-center">{message}</p>}
  </div>
);
