import { FC, ReactNode } from "react";
import { NodeComponent } from "./Node";
import { useTranslation } from "react-i18next";

export const EdgeComponent: FC<{
  source: { label: ReactNode; color: string };
  target: { label: ReactNode; color: string };
  label: ReactNode;
  color: string;
}> = ({ label, color, source, target }) => {
  const { t } = useTranslation();

  return (
    <div className="d-flex flex-column">
      <div>
        <NodeComponent {...source} />
      </div>
      <div>
        <span className="dash" style={{ backgroundColor: color }} />{" "}
        {label || <span className="fst-italic">{t("appearance.labels.none")}</span>}
      </div>
      <div>
        <NodeComponent {...target} />
      </div>
    </div>
  );
};
