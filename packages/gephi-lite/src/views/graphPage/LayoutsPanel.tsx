import { useAtom } from "@ouestware/atoms";
import cx from "classnames";
import { isNil } from "lodash";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import Highlight from "react-highlight";
import { useTranslation } from "react-i18next";
import { FaPlay, FaStop } from "react-icons/fa";

import { InformationTooltip } from "../../components/InformationTooltip";
import { LoaderFill } from "../../components/Loader";
import MessageTooltip from "../../components/MessageTooltip";
import { CodeEditorIcon, LayoutsIcon } from "../../components/common-icons";
import { LayoutQualityForm } from "../../components/forms/LayoutQualityForm";
import { Select } from "../../components/forms/Select";
import { BooleanInput, EnumInput, NumberInput } from "../../components/forms/TypedInputs";
import { useGraphDataset, useLayoutActions, useLayoutState, useSigmaGraph } from "../../core/context/dataContexts";
import { FieldModel } from "../../core/graph/types";
import { getFilteredDataGraph } from "../../core/graph/utils";
import { LAYOUTS } from "../../core/layouts/collection";
import { Layout, LayoutScriptParameter } from "../../core/layouts/types";
import { useModal } from "../../core/modals";
import { useNotifications } from "../../core/notifications";
import { sessionAtom } from "../../core/session";
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
          setSuccessMessage(t("layouts.exec.success", { layout: t(`layouts.${layout.id}.title`) as string }) as string);
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
      <div className="panel-block-grow">
        <h3 className="fs-5">{t(`layouts.${layout.id}.title`)}</h3>
        {layout.description && <p className="text-muted small">{t(`layouts.${layout.id}.description`)}</p>}

        {layout.parameters.map((param) => {
          const value = layoutParameters[param.id];
          const id = `layouts-${layout.id}-params-${param.id})}`;
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
                  label={t(`layouts.${layout.id}.parameters.${param.id}.title`) as string}
                  description={
                    param.description
                      ? (t(`layouts.${layout.id}.parameters.${param.id}.description`) as string)
                      : undefined
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
                  label={t(`layouts.${layout.id}.parameters.${param.id}.title`) as string}
                  required={param.required}
                  description={
                    param.description
                      ? (t(`layouts.${layout.id}.parameters.${param.id}.description`) as string)
                      : undefined
                  }
                  placeholder={t("common.none") as string}
                  value={value as string}
                  disabled={isRunning}
                  onChange={(v) => onChangeParameters(param.id, v)}
                  options={((param.itemType === "nodes" ? nodeFields : edgeFields) as FieldModel[])
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
                    {value && (
                      <>
                        <div className="code-thumb mt-1" style={{ height: "auto", maxHeight: "auto" }}>
                          <Highlight className="javascript">
                            {(value as LayoutScriptParameter["defaultValue"]).toString()}
                          </Highlight>
                        </div>
                        <div className="filler-fade-out position-absolute bottom-0"></div>
                      </>
                    )}
                    <div className={cx(value ? "bottom-0 position-absolute w-100" : "")}>
                      <button
                        type="button"
                        className="btn btn-dark mx-auto d-block m-3"
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

      <hr className="m-0" />

      <div className="z-over-loader panel-block d-flex flex-row gap-1 flex-wrap align-items-center justify-content-end">
        {success && (
          <MessageTooltip
            openOnMount={2000}
            key={success.date}
            message={success.message}
            type="success"
            iconClassName="fs-4"
          />
        )}
        <div className="flex-grow-1" />

        {layout.buttons?.map(({ id, description, getSettings }) => (
          <button
            key={id}
            type="reset"
            className="btn text-nowrap mt-1 btn-secondary"
            title={description ? (t(`layouts.${layout.id}.buttons.${id}.description`) as string) : undefined}
            onClick={() => {
              const graph = getFilteredDataGraph(dataset, sigmaGraph);
              setParameters(getSettings(layoutParameters, graph));
            }}
            disabled={isRunning}
          >
            {t(`layouts.${layout.id}.buttons.${id}.title`) as string}
          </button>
        ))}
        <button
          type="reset"
          className="btn text-nowrap mt-1 btn-secondary"
          onClick={() => setParameters()}
          disabled={isRunning}
        >
          {t("common.reset")}
        </button>
        <button type="submit" className="btn text-nowrap mt-1 btn-primary">
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
  const { startLayout, stopLayout } = useLayoutActions();
  const { type } = useLayoutState();

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
    <>
      <div className="panel-block">
        <h2 className="fs-4 d-flex align-items-center gap-1">
          <LayoutsIcon className="me-1" /> {t("layouts.title")}
          <InformationTooltip>
            <p className="text-muted small">{t("layouts.description")}</p>
          </InformationTooltip>
        </h2>
        <p className="text-muted small d-none d-md-block">{t("layouts.description")}</p>

        <Select<LayoutOption | null>
          options={options}
          value={option}
          onChange={(option) => {
            setOption(option);
            stopLayout();
          }}
          placeholder={t("layouts.placeholder")}
        />
      </div>

      {option?.layout ? (
        <>
          <hr className="m-0" />
          <LayoutForm
            key={option.layout.id}
            layout={option.layout}
            onStart={async (params) => {
              try {
                await startLayout(option.layout.id, params);
              } catch (e) {
                notify({ type: "error", message: (e as Error).message });
              }
            }}
            onStop={() => {
              stopLayout();
            }}
            isRunning={type === "running"}
            onCancel={() => {
              stopLayout();
              setOption(null);
            }}
          />
        </>
      ) : (
        <div className="flex-grow-1" />
      )}
      <hr className="m-0" />
      <LayoutQualityForm />
    </>
  );
};
