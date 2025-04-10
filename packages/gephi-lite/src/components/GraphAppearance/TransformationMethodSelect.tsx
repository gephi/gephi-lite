import { FC, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { TransformationMethod } from "../../core/appearance/types";
import { Select } from "../forms/Select";
import { TransformationMethodPreview } from "./TransformationMethodPreview";

export const TransformationMethodsSelect: FC<{
  id?: string;
  method?: TransformationMethod;
  onChange: (name: TransformationMethod | null) => void;
}> = ({ id, method, onChange }) => {
  const { t } = useTranslation();

  const options = useMemo(
    () => [
      { value: "", label: t("appearance.transformation_methods.linear").toString() },
      { value: "pow-2", label: t("appearance.transformation_methods.pow-2").toString() },
      { value: "pow-3", label: t("appearance.transformation_methods.pow-3").toString() },
      { value: "pow-0.5", label: t("appearance.transformation_methods.sqrt").toString() },
      { value: "log", label: t("appearance.transformation_methods.log").toString() },
    ],
    [t],
  );

  const value = useMemo(() => {
    const result =
      typeof method === "object" && "pow" in method ? `pow-${method.pow}` : method === "log" ? "log" : undefined;
    return { value: result, label: result };
  }, [method]);

  return (
    <>
      <label htmlFor={id || "transformation-method"}>{t("appearance.transformation_methods.title")}</label>
      <div className="d-flex align-items-bottom ">
        <Select
          id={id || "transformation-method"}
          className="me-2 flex-grow-1 form-control-sm"
          value={value}
          options={options}
          onChange={(e) => {
            let method: TransformationMethod | null = null;
            if (e) {
              switch (e.value) {
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
            }
            onChange(method);
          }}
        />

        <TransformationMethodPreview method={method} />
      </div>
    </>
  );
};
