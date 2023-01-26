import { FC, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Select from "react-select";

import { LayoutsIcon } from "../../components/common-icons";
import { LAYOUTS } from "../../core/layouts";
import { Layout } from "../../core/layouts/types";
import { useNotifications } from "../../core/notifications";
import { BooleanInput, NumberInput } from "../../components/forms/TypedInputs";

type LayoutOption = {
  value: string;
  label: string;
  layout: Layout;
};

export const LayoutForm: FC<{ layout: Layout; onSuccess: () => void; onCancel: () => void }> = ({
  layout,
  onSuccess,
  onCancel,
}) => {
  const { t } = useTranslation();
  const [paramsState, setParamsState] = useState<Record<string, unknown>>(
    layout.parameters.reduce(
      (iter, param) => ({
        ...iter,
        [param.id]: param.defaultValue || undefined,
      }),
      {},
    ),
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSuccess();
      }}
    >
      <h3 className="fs-5 mt-3">{t(`layouts.${layout.id}.title`)}</h3>
      {layout.description && <p className="text-muted small">{t(`layouts.${layout.id}.description`)}</p>}

      {layout.parameters.map((param) => {
        const id = `layouts-${layout.id}-params-${param.id}`;
        return (
          <div className="my-1" key={id}>
            {param.type === "number" && (
              <NumberInput
                id={id}
                label={t(`layouts.${layout.id}.parameters.${param.id}.title`) as string}
                description={
                  param.description
                    ? (t(`layouts.${layout.id}.parameters.${param.id}.description`) as string)
                    : undefined
                }
                value={paramsState[param.id] as number}
                onChange={(v) => setParamsState((s) => ({ ...s, [param.id]: v }))}
              />
            )}
            {param.type === "boolean" && (
              <BooleanInput
                id={id}
                label={t(`layouts.${layout.id}.parameters.${param.id}.title`) as string}
                description={
                  param.description
                    ? (t(`layouts.${layout.id}.parameters.${param.id}.description`) as string)
                    : undefined
                }
                value={paramsState[param.id] as boolean}
                onChange={(v) => setParamsState((s) => ({ ...s, [param.id]: v }))}
              />
            )}
          </div>
        );
      })}

      <div className="text-end mt-2">
        <button type="button" className="btn btn-secondary ms-2" onClick={() => onCancel()}>
          {t("common.cancel")}
        </button>
        <button type="submit" className="btn btn-primary ms-2">
          {t("common.submit")}
        </button>
      </div>
    </form>
  );
};

export const LayoutsPanel: FC = () => {
  const { t } = useTranslation();
  const { notify } = useNotifications();

  const options: Array<LayoutOption> = useMemo(
    () =>
      LAYOUTS.map((l) => ({
        value: l.id,
        label: t(`layouts.${l.id}.title`),
        layout: l,
      })),
    [t],
  );
  const [option, setOption] = useState<LayoutOption | null>(null);

  return (
    <div>
      <h2 className="fs-4">
        <LayoutsIcon className="me-1" /> {t("layouts.title")}
      </h2>
      <p className="text-muted small">{t("layouts.description")}</p>

      <Select<LayoutOption, false>
        options={options}
        value={option}
        onChange={setOption}
        placeholder={t("layouts.placeholder")}
      />

      {option?.layout && (
        <>
          <hr />
          <LayoutForm
            layout={option.layout}
            onSuccess={() => {
              notify({ type: "success", message: "SUCCESS TODO", title: t("statistics.title") as string });
              setOption(null);
            }}
            onCancel={() => setOption(null)}
          />
        </>
      )}
    </div>
  );
};
