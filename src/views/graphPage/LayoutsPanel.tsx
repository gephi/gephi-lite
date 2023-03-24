import { FC, useMemo, useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import Select from "react-select";
import { FaPlay, FaStop } from "react-icons/fa";
import Highlight from "react-highlight";
import cx from "classnames";
import { isNil } from "lodash";

import { LayoutsIcon, CodeEditorIcon } from "../../components/common-icons";
import { useAtom } from "../../core/utils/atoms";
import { sessionAtom } from "../../core/session";
import { LAYOUTS } from "../../core/layouts/collection";
import { Layout, LayoutScriptParameter } from "../../core/layouts/types";
import { useLayouts } from "../../core/layouts/useLayouts";
import { useNotifications } from "../../core/notifications";
import { useModal } from "../../core/modals";
import { BooleanInput, EnumInput, NumberInput } from "../../components/forms/TypedInputs";
import { FieldModel } from "../../core/graph/types";
import { useGraphDataset } from "../../core/context/dataContexts";
import { FunctionEditorModal } from "./modals/FunctionEditorModal";

type LayoutOption = {
  value: string;
  label: string;
  layout: Layout;
};

export const LayoutForm: FC<{
  layout: Layout;
  onCancel: () => void;
  onStart: (params: Record<string, unknown>) => void;
  onStop: () => void;
  isRunning: boolean;
}> = ({ layout, onCancel, onStart, onStop, isRunning }) => {
  const { t } = useTranslation();
  const { openModal } = useModal();
  const dataset = useGraphDataset();
  const { nodeFields, edgeFields } = dataset;
  // get layout parameter from the session if it exists
  const [session, setSession] = useAtom(sessionAtom);
  const layoutParameters = session.layoutsParameters[layout.id] || {};

  // default layout parameters
  const layoutDefaultParameters = useMemo(
    () =>
      layout.parameters.reduce(
        (iter, param) => ({
          ...iter,
          [param.id]: !isNil(param.defaultValue) ? param.defaultValue : undefined,
        }),
        {},
      ),
    [layout],
  );

  /**
   * When the layout change
   * => we load the layout paramaters
   */
  useEffect(() => {
    setSession((prev) => ({
      ...prev,
      layoutsParameters: {
        ...prev.layoutsParameters,
        [layout.id]: {
          ...layoutDefaultParameters,
          ...(prev.layoutsParameters[layout.id] || {}),
        },
      },
    }));
  }, [layout, layoutDefaultParameters, setSession]);

  /**
   * OnChange function for parameters
   */
  const onChangeParameters = useCallback(
    (key: string, value: unknown) => {
      setSession((prev) => ({
        ...prev,
        layoutsParameters: {
          ...prev.layoutsParameters,
          [layout.id]: {
            ...(prev.layoutsParameters[layout.id] || {}),
            ...{ [key]: value },
          },
        },
      }));
    },
    [layout.id, setSession],
  );

  /**
   * Reset parameters for the current layout
   */
  const resetParameters = useCallback(() => {
    setSession((prev) => ({
      ...prev,
      layoutsParameters: {
        ...prev.layoutsParameters,
        [layout.id]: layoutDefaultParameters,
      },
    }));
  }, [layout.id, layoutDefaultParameters, setSession]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (isRunning) onStop();
        else onStart(layoutParameters);
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
                value={layoutParameters[param.id] as number}
                disabled={isRunning}
                onChange={(v) => onChangeParameters(param.id, v)}
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
                value={layoutParameters[param.id] as boolean}
                disabled={isRunning}
                onChange={(v) => onChangeParameters(param.id, v)}
              />
            )}
            {param.type === "attribute" && (
              <EnumInput
                id={id}
                label={t(`layouts.${layout.id}.parameters.${param.id}.title`) as string}
                required={param.required}
                description={
                  param.description
                    ? (t(`layouts.${layout.id}.parameters.${param.id}.description`) as string)
                    : undefined
                }
                placeholder={t("common.none") as string}
                value={layoutParameters[param.id] as string}
                disabled={isRunning}
                onChange={(v) => onChangeParameters(param.id, v)}
                options={((param.itemType === "nodes" ? nodeFields : edgeFields) as FieldModel<any>[])
                  .filter((field) => (param.restriction ? !!field[param.restriction] : true))
                  .map((field) => ({
                    value: field.id,
                    label: field.id,
                  }))}
              />
            )}
            {param.type === "script" && (
              <div className="position-relative">
                <>
                  {layoutParameters[param.id] && (
                    <>
                      <div className="code-thumb mt-1" style={{ height: "auto", maxHeight: "auto" }}>
                        <Highlight className="javascript">
                          {(layoutParameters[param.id] as LayoutScriptParameter["defaultValue"]).toString()}
                        </Highlight>
                      </div>
                      <div className="filler-fade-out position-absolute bottom-0"></div>
                    </>
                  )}
                  <div className={cx(layoutParameters[param.id] ? "bottom-0 position-absolute w-100" : "")}>
                    <button
                      type="button"
                      className="btn btn-dark mx-auto d-block m-3"
                      onClick={() =>
                        openModal({
                          component: FunctionEditorModal<LayoutScriptParameter["defaultValue"]>,
                          arguments: {
                            title: "Custom layout",
                            functionJsDoc: param.functionJsDoc,
                            defaultFunction: param.defaultValue,
                            value: layoutParameters[param.id] as LayoutScriptParameter["defaultValue"],
                            checkFunction: param.functionCheck,
                          },
                          beforeSubmit: (script) => {
                            onChangeParameters(param.id, script);
                          },
                        })
                      }
                      title={t("common.open_code_editor").toString()}
                    >
                      <CodeEditorIcon className="me-1" />
                      {t("common.open_code_editor")}
                    </button>
                  </div>
                </>
              </div>
            )}
          </div>
        );
      })}

      <div className="text-end mt-2">
        <button type="reset" className="btn btn-secondary ms-2" onClick={() => resetParameters()}>
          {t("common.reset")}
        </button>
        <button type="submit" className="btn btn-primary ms-2">
          {layout.type === "sync" && <>{t("common.apply")}</>}
          {layout.type === "worker" && (
            <>
              {isRunning ? (
                <>
                  <FaStop className="me-1" />
                  {t("common.stop")}
                </>
              ) : (
                <>
                  <FaPlay className="me-1" />
                  {t("common.start")}
                </>
              )}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export const LayoutsPanel: FC = () => {
  const { t } = useTranslation();
  const { notify } = useNotifications();
  const { isRunning, start, stop } = useLayouts();

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
        onChange={(option) => {
          setOption(option);
          stop();
        }}
        placeholder={t("layouts.placeholder")}
      />

      {option?.layout && (
        <>
          <hr />
          <LayoutForm
            layout={option.layout}
            onStart={(params) => {
              start(option.layout.id, params);
              if (option.layout.type === "sync") {
                notify({
                  type: "success",
                  message: t("layouts.exec.success", {
                    layout: t(`layouts.${option.layout.id}.title`).toString(),
                  }).toString(),
                  title: t("layouts.title") as string,
                });
              } else {
                notify({
                  type: "info",
                  message: t("layouts.exec.started", {
                    layout: t(`layouts.${option.layout.id}.title`).toString(),
                  }).toString(),
                  title: t("layouts.title") as string,
                });
              }
            }}
            onStop={() => {
              stop();
              notify({
                type: "info",
                message: t("layouts.exec.stopped", {
                  layout: t(`layouts.${option.layout.id}.title`).toString(),
                }).toString(),
                title: t("layouts.title") as string,
              });
            }}
            isRunning={isRunning}
            onCancel={() => {
              stop();
              setOption(null);
            }}
          />
        </>
      )}
    </div>
  );
};
