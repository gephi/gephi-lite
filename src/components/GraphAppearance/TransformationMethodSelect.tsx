import { FC } from "react";
import { useTranslation } from "react-i18next";

export const TransformationMethodsSelect: FC<{ id?: string }> = ({ id }) => {
  const { t } = useTranslation();
  return (
    <>
      <label htmlFor={id || "transformation-method"}>{t("appearance.transformation_methods.title")}</label>
      <select id={id || "transformation-method"} className="form-select">
        <option value="">{t("appearance.transformation_methods.linear")}</option>
        <option>{t("appearance.transformation_methods.pow-2")}</option>
        <option>{t("appearance.transformation_methods.pow-3")}</option>
        <option>{t("appearance.transformation_methods.sqrt")}</option>
        <option>{t("appearance.transformation_methods.log")}</option>
        <option disabled>{t("appearance.transformation_methods.spline")} TODO</option>
      </select>
    </>
  );
};
