import { FC, CSSProperties } from "react";
import cx from "classnames";
import { useTranslation } from "react-i18next";

export const Spinner: FC<{ className?: string; style?: CSSProperties }> = ({ className, style }) => {
  const { t } = useTranslation();
  return (
    <div className={cx("spinner-border", className)} style={style} role="status">
      <span className="visually-hidden">{t("common.loading").toString()}...</span>
    </div>
  );
};

export const Loader: FC = () => (
  <div className="loader-fill">
    <Spinner style={{ width: "3rem", height: " 3rem" }} />
  </div>
);
