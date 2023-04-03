import { FC } from "react";
import { useTranslation } from "react-i18next";
import { TransformationMethod } from "../../core/appearance/types";
import { TransformationMethodPreview } from "./TransformationMethodPreview";

export const TransformationMethodsSelect: FC<{
  id?: string;
  method?: TransformationMethod;
  onChange: (name: TransformationMethod | null) => void;
}> = ({ id, method, onChange }) => {
  const { t } = useTranslation();

  return (
    <>
      <label htmlFor={id || "transformation-method"}>{t("appearance.transformation_methods.title")}</label>
      <div className="d-flex align-items-bottom ">
        <select
          id={id || "transformation-method"}
          className="form-select me-2"
          onChange={(e) => {
            let method: TransformationMethod | null = null;
            switch (e.target.value) {
              case "pow-2":
                method = { pow: 2 };
                break;
              case "pow-3":
                method = { pow: 3 };
                break;
              case "pow-0.5":
                method = { pow: 0.5 };
                break;
              case "log":
                method = "log";
            }
            onChange(method);
          }}
          value={
            typeof method === "object" && "pow" in method ? `pow-${method.pow}` : method === "log" ? "log" : undefined
          }
        >
          <option value="">{t("appearance.transformation_methods.linear")}</option>
          <option value="pow-2">{t("appearance.transformation_methods.pow-2")}</option>
          <option value="pow-3">{t("appearance.transformation_methods.pow-3")}</option>
          <option value="pow-0.5">{t("appearance.transformation_methods.sqrt")}</option>
          <option value="log">{t("appearance.transformation_methods.log")}</option>
          {/* <option disabled>{t("appearance.transformation_methods.spline")} TODO</option> */}
        </select>

        <TransformationMethodPreview method={method} />
      </div>
    </>
  );
};
