import { useAtom } from "@ouestware/atoms";
import cx from "classnames";
import { isNil } from "lodash";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import Highlight from "react-highlight";
import { useTranslation } from "react-i18next";
import { FaPlay, FaStop } from "react-icons/fa";

import { LoaderFill } from "../../../../components/Loader";
import MessageTooltip from "../../../../components/MessageTooltip";
import { CodeEditorIcon } from "../../../../components/common-icons";
import { BooleanInput, EnumInput, NumberInput } from "../../../../components/forms/TypedInputs";
import { FunctionEditorModal } from "../../../../components/modals/FunctionEditorModal";
import { useGraphDataset, useSigmaGraph } from "../../../../core/context/dataContexts";
import { FieldModel } from "../../../../core/graph/types";
import { getFilteredDataGraph } from "../../../../core/graph/utils";
import { Layout, LayoutScriptParameter } from "../../../../core/layouts/types";
import { useModal } from "../../../../core/modals";
import { sessionAtom } from "../../../../core/session";

export const LayoutForm: FC<{
  layout: Layout;
  onCancel: () => void;
  onStart: (params: Record<string, unknown>) => void;
  onStop: () => void;
  isRunning: boolean;
}> = ({ layout, onStart, onStop, isRunning }) => {
  const { t } = useTranslation();
  const { openModal } = useModal();
  const dataset = useGraphDataset();
  const sigmaGraph = useSigmaGraph();
  const { nodeFields, edgeFields } = dataset;
  const [success, setSuccess] = useState<{ date: number; message: string } | null>(null);
  // get layout parameter from the session if it exists
  const [session, setSession] = useAtom(sessionAtom);
  const layoutParameters = useMemo(
    () => session.layoutsParameters[layout.id] || {},
    [layout.id, session.layoutsParameters],
  );
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
  const setParameters = useCallback(
    (newParameters?: Record<string, unknown>) => {
      setSession((prev) => ({
        ...prev,
        layoutsParameters: {
          ...prev.layoutsParameters,
          [layout.id]: !isNil(newParameters) ? newParameters : layoutDefaultParameters,
        },
      }));
    },
    [layout.id, layoutDefaultParameters, setSession],
  );

  const setSuccessMessage = useCallback((message?: string) => {
    if (typeof message === "string") {
      setSuccess({ date: Date.now(), message });
    } else {
      setSuccess(null);
    }
  }, []);

  const submit = useCallback(() => {
    if (isRunning) onStop();
    else {
      try {
        onStart(layoutParameters);
        if (layout.type === "sync")
          setSuccessMessage(t("layouts.exec.success", { layout: t(`layouts.${layout.id}.title`) }));
      } catch (e) {
        console.error(e);
      }
    }
  }, [isRunning, layout.id, layout.type, layoutParameters, onStart, onStop, setSuccessMessage, t]);

  return (
    <form
      className="panel-wrapper"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      noValidate
    >
      <h2>{t(`layouts.${layout.id}.title`)}</h2>
      {layout.description && <p className="gl-text-muted">{t(`layouts.${layout.id}.description`)}</p>}

      <div className="panel-block">
        {layout.parameters.map((param) => {
          const value = layoutParameters[param.id];
          const id = `layouts-${layout.id}-params-${param.id}`;
          return (
            <div className="panel-block" key={id}>
              {param.type === "number" && (
                <NumberInput
                  id={id}
                  label={t(`layouts.${layout.id}.parameters.${param.id}.title`)}
                  description={
                    param.description ? t(`layouts.${layout.id}.parameters.${param.id}.description`) : undefined
                  }
                  value={value as number}
                  disabled={isRunning}
                  onChange={(v) => onChangeParameters(param.id, v)}
                  required={param.required || false}
                  min={param.min}
                  max={param.max}
                  step={param.step}
                />
              )}
              {param.type === "boolean" && (
                <BooleanInput
                  id={id}
                  label={t(`layouts.${layout.id}.parameters.${param.id}.title`)}
                  description={
                    param.description ? t(`layouts.${layout.id}.parameters.${param.id}.description`) : undefined
                  }
                  value={!!value as boolean}
                  disabled={isRunning}
                  onChange={(v) => onChangeParameters(param.id, v)}
                  required={param.required || false}
                />
              )}
              {param.type === "attribute" && (
                <EnumInput
                  id={id}
                  label={t(`layouts.${layout.id}.parameters.${param.id}.title`)}
                  required={param.required}
                  description={
                    param.description ? t(`layouts.${layout.id}.parameters.${param.id}.description`) : undefined
                  }
                  placeholder={t("common.none")}
                  value={value as string}
                  disabled={isRunning}
                  onChange={(v) => onChangeParameters(param.id, v)}
                  options={((param.itemType === "nodes" ? nodeFields : edgeFields) as FieldModel[])
                    .filter((field) => (param.restriction ? param.restriction.includes(field.type) : true))
                    .map((field) => ({
                      value: field.id,
                      label: field.id,
                    }))}
                />
              )}
              {param.type === "script" && (
                <div className="position-relative">
                  <>
                    {value && (
                      <>
                        <div className="code-thumb" style={{ height: "auto", maxHeight: "auto" }}>
                          <Highlight className="javascript">
                            {(value as LayoutScriptParameter["defaultValue"]).toString()}
                          </Highlight>
                        </div>
                        <div className="filler-fade-out position-absolute bottom-0"></div>
                      </>
                    )}
                    <div className={cx(value ? "bottom-0 top-0 position-absolute w-100 h-100" : "", " ")}>
                      <button
                        type="button"
                        className="gl-btn gl-btn-outline  gl-container-highest-bg mx-auto d-block m-3"
                        onClick={() =>
                          openModal({
                            component: FunctionEditorModal<LayoutScriptParameter["defaultValue"]>,
                            arguments: {
                              title: "Custom layout",
                              withSaveAndRun: true,
                              functionJsDoc: param.functionJsDoc,
                              defaultFunction: param.defaultValue,
                              value: value as LayoutScriptParameter["defaultValue"],
                              checkFunction: param.functionCheck,
                            },
                            beforeSubmit: ({ run, script }) => {
                              onChangeParameters(param.id, script);
                              if (run) setTimeout(submit, 0);
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
        {isRunning && <LoaderFill />}
      </div>

      <div className="panel-footer">
        {success && (
          <MessageTooltip
            openOnMount={2000}
            key={success.date}
            message={success.message}
            type="success"
            iconClassName="fs-4"
          />
        )}

        {layout.buttons?.map(({ id, description, getSettings }) => (
          <button
            key={id}
            type="reset"
            className="gl-btn"
            title={description ? t(`layouts.${layout.id}.buttons.${id}.description`) : undefined}
            onClick={() => {
              const graph = getFilteredDataGraph(dataset, sigmaGraph);
              setParameters(getSettings(layoutParameters, graph));
            }}
            disabled={isRunning}
          >
            {t(`layouts.${layout.id}.buttons.${id}.title`)}
          </button>
        ))}
        <button type="reset" className="gl-btn" onClick={() => setParameters()} disabled={isRunning}>
          {t("common.reset")}
        </button>
        <button type="submit" className="gl-btn gl-btn-fill">
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
