import { FieldModel } from "@gephi/gephi-lite-sdk";
import { useAtom } from "@ouestware/atoms";
import cx from "classnames";
import { isNil, omit } from "lodash";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import Highlight from "react-highlight";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import MessageAlert from "../../../../components/MessageAlert";
import {
  CodeEditorIcon,
  ExternalLinkIcon,
  PauseIconFill,
  PlayIconFill,
  ResetIcon,
} from "../../../../components/common-icons";
import { BooleanInput, EnumInput, NumberInput } from "../../../../components/forms/TypedInputs";
import { FunctionEditorModal } from "../../../../components/modals/FunctionEditor";
import { useGraphDataset, useSigmaGraph } from "../../../../core/context/dataContexts";
import { getFilteredDataGraph } from "../../../../core/graph/utils";
import { Layout, LayoutScriptParameter } from "../../../../core/layouts/types";
import { useModal } from "../../../../core/modals";
import { sessionAtom } from "../../../../core/session";

export const LayoutForm: FC<{
  layout: Layout;
  onCancel: () => void;
  onStart: (input: { params: Record<string, unknown>; then?: () => void; restart?: boolean }) => void;
  onStop: () => void;
  isRunning: boolean;
}> = ({ layout, onStart, onStop, isRunning }) => {
  const { t } = useTranslation();
  const { openModal } = useModal();
  const dataset = useGraphDataset();
  const sigmaGraph = useSigmaGraph();
  const { nodeFields, edgeFields } = dataset;
  const [errors, setErrors] = useState<{ [fieldId: string]: string } | null>(null);
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
  // inferred parameters (smart defaults from graph data)
  const inferredParameters = useMemo(() => {
    if (!layout.inferSettings) return {};
    return layout.inferSettings(getFilteredDataGraph(dataset, sigmaGraph));
  }, [layout, dataset, sigmaGraph]);

  /**
   * When layout params changed
   * => we check for form errors
   */
  useEffect(() => {
    const errors: { [fieldId: string]: string } = {};
    layout.parameters.forEach((param) => {
      const name = t(`layouts.${layout.id}.parameters.${param.id}.title`);
      const value = layoutParameters[param.id];

      if (param.required === true && isNil(value)) errors[param.id] = t(`error.form.required`, { ...param, name });
      else if ("min" in param && param.min && !isNil(value) && (value as number) < param.min)
        errors[param.id] = t(`error.form.min`, { ...param, name });
      else if ("max" in param && param.max && !isNil(value) && (value as number) > param.max)
        errors[param.id] = t(`error.form.max`, { ...param, name });
    });

    const hasError = Object.keys(errors).length > 0;
    setErrors(hasError ? errors : null);

    if (layout.type === "worker" && !hasError && isRunning) {
      onStart({ params: layoutParameters, restart: true });
    }
    // I don't want to trigger this useeffect when the isRunning value changed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, layoutParameters, t, onStart]);

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
          ...inferredParameters,
          ...(prev.layoutsParameters[layout.id] || {}),
        },
      },
    }));
  }, [layout, layoutDefaultParameters, inferredParameters, setSession]);

  /**
   * OnChange function for parameters
   * if the new value is null or undefined, we remove it from the parameters.
   */
  const changeParameter = useCallback(
    (key: string, value: unknown) => {
      setSession((prev) => ({
        ...prev,
        layoutsParameters: {
          ...prev.layoutsParameters,
          [layout.id]: {
            ...omit(prev.layoutsParameters[layout.id] || {}, [key]),
            ...(!isNil(value) ? { [key]: value } : {}),
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
    if (errors) {
      console.error(errors);
      return;
    }

    if (isRunning) onStop();
    else {
      try {
        // Read the latest layout parameters from the atom directly,
        // to ensure having up-to-date data:
        const latestSession = sessionAtom.get();
        const latestLayoutParameters = latestSession.layoutsParameters[layout.id] || {};
        onStart({ params: latestLayoutParameters });
        if (layout.type === "sync")
          setSuccessMessage(t("layouts.exec.success", { layout: t(`layouts.${layout.id}.title`) }));
      } catch (e) {
        console.error(e);
      }
    }
  }, [isRunning, layout.id, layout.type, onStart, onStop, setSuccessMessage, t, errors]);

  return (
    <form
      className="panel-wrapper"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      noValidate
    >
      <div className="panel-body">
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
                    onChange={(v) => changeParameter(param.id, v)}
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
                    onChange={(v) => changeParameter(param.id, v)}
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
                    onChange={(v) => changeParameter(param.id, v)}
                    options={((param.itemType === "nodes" ? nodeFields : edgeFields) as FieldModel[])
                      .filter((field) => (param.restriction ? param.restriction.includes(field.type) : true))
                      .map((field) => ({
                        value: field.id,
                        label: field.id,
                      }))}
                  />
                )}
                {param.type === "enum" && (
                  <EnumInput
                    id={id}
                    label={t(`layouts.${layout.id}.parameters.${param.id}.title`)}
                    description={
                      param.description ? t(`layouts.${layout.id}.parameters.${param.id}.description`) : undefined
                    }
                    value={(value as string) ?? param.defaultValue}
                    disabled={isRunning}
                    onChange={(v) => changeParameter(param.id, v)}
                    options={param.options.map((opt) => ({
                      value: opt.id,
                      label: t(`layouts.${layout.id}.parameters.${param.id}.options.${opt.id}`),
                    }))}
                    required
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
                                title: t("layouts.script.title"),
                                description: (
                                  <div className="m-3">
                                    <p className="mb-0">{t("layouts.script.description")}</p>
                                    <Link
                                      to="https://docs.gephi.org/lite/user-manual/custom-scripts"
                                      title={t("common.help")}
                                      target="_blank"
                                    >
                                      {t("common.see-documentation")}
                                      <ExternalLinkIcon className="ms-1" />
                                    </Link>
                                  </div>
                                ),
                                withSaveAndRun: true,
                                functionJsDoc: param.functionJsDoc,
                                initialFunctionCode: value?.toString() ?? param.defaultValue.toString(),
                                checkFunction: param.functionCheck,
                              },
                              beforeSubmit: ({ run, fn }) => {
                                changeParameter(param.id, fn);
                                if (run) submit();
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
        </div>
      </div>

      <div className="panel-footer ">
        {success && (
          <MessageAlert key={success.date} message={<p className="gl-m-0">{success.message}</p>} type="success" />
        )}
        {errors && (
          <MessageAlert
            key={JSON.stringify(errors)}
            message={
              <ul className="list-unstyled">
                {Object.keys(errors).map((fieldId) => (
                  <li key={fieldId} className="gl-my-2">
                    {errors[fieldId]}
                  </li>
                ))}
              </ul>
            }
            type="error"
          />
        )}
        <div className="gl-actions">
          {layout.buttons?.map((button) => {
            const { id, description, icon: Icon, disabled, onClick } = button;
            const title = description
              ? t(`layouts.${layout.id}.buttons.${id}.description`)
              : t(`layouts.${layout.id}.buttons.${id}.title`);
            const graph = getFilteredDataGraph(dataset, sigmaGraph);
            const isButtonDisabled = isRunning || errors !== null || !!disabled?.(layoutParameters, graph);
            return (
              <button
                key={id}
                type="button"
                className={cx("gl-btn gl-btn-outline", Icon && "gl-btn-icon")}
                title={title}
                disabled={isButtonDisabled}
                onClick={() => {
                  const instructions = onClick(layoutParameters, graph);
                  if (instructions.setSettings) setParameters(instructions.setSettings as Record<string, unknown>);
                  if (instructions.applyLayout) {
                    if (errors || isRunning) return;
                    instructions.before?.();
                    const params = (instructions.setSettings ?? layoutParameters) as Record<string, unknown>;
                    onStart({ params, then: instructions.then });
                    if (layout.type === "sync")
                      setSuccessMessage(t("layouts.exec.success", { layout: t(`layouts.${layout.id}.title`) }));
                  } else {
                    instructions.before?.();
                    instructions.then?.();
                  }
                }}
              >
                {Icon ? <Icon /> : t(`layouts.${layout.id}.buttons.${id}.title`)}
              </button>
            );
          })}
          {!layout.hideReset && (
            <button
              type="reset"
              title={t("common.reset")}
              className="gl-btn gl-btn-outline gl-btn-icon"
              onClick={() => setParameters()}
            >
              <ResetIcon />
            </button>
          )}
          <button type="submit" className="gl-btn gl-btn-fill" disabled={errors !== null}>
            {isRunning && (
              <>
                <PauseIconFill />
                {t("common.stop")}
              </>
            )}
            {!isRunning && layout.type === "sync" && <>{t("common.apply")}</>}
            {!isRunning && layout.type === "worker" && (
              <>
                <PlayIconFill />
                {t("common.start")}
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};
