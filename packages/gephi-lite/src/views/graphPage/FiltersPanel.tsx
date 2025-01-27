import { FC } from "react";
import { useTranslation } from "react-i18next";

import GraphFilters from "../../components/GraphFilters";
import { InformationTooltip } from "../../components/InformationTooltip";
import { FiltersIcon } from "../../components/common-icons";

export const FiltersPanel: FC = () => {
  const { t } = useTranslation();
  return (
    <>
      <div className="panel-block">
        <h2 className="fs-4 d-flex align-items-center gap-1">
          <FiltersIcon className="me-1" /> {t("filters.title")}
          <InformationTooltip>
            <p className="text-muted small m-0">{t("filters.description")}</p>
          </InformationTooltip>
        </h2>
        <p className="text-muted small m-0 d-none d-md-block">{t("filters.description")}</p>
      </div>

      <hr className="m-0" />

      <GraphFilters />
    </>
  );
};
