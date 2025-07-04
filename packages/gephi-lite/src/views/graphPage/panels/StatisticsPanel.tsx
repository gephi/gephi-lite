import { useAtom } from "@ouestware/atoms";
import cx from "classnames";
import { cloneDeep, flatMap, isNil, keyBy, map, mapValues } from "lodash";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import Highlight from "react-highlight";
import { useTranslation } from "react-i18next";

import MessageTooltip from "../../../components/MessageTooltip";
import { CodeEditorIcon } from "../../../components/common-icons";
import { BooleanInput, EnumInput, NumberInput, StringInput } from "../../../components/forms/TypedInputs";
import { FunctionEditorModal } from "../../../components/modals/FunctionEditorModal";
import { useFilteredGraph, useGraphDataset, useGraphDatasetActions } from "../../../core/context/dataContexts";
import { FieldModel } from "../../../core/graph/types";
import { computeMetric } from "../../../core/metrics";
import { Metric, MetricScriptParameter } from "../../../core/metrics/types";
import { useModal } from "../../../core/modals";
import { useNotifications } from "../../../core/notifications";
import { sessionAtom } from "../../../core/session";
import { ItemType } from "../../../core/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const MetricForm: FC<{ metric: Metric<any>; onClose?: () => void }> = ({ metric }) => {
  const { t } = useTranslation();
  const { notify } = useNotifications();
  const { openModal } = useModal();
  const filteredGraph = useFilteredGraph();
  const dataset = useGraphDataset();
  const { nodeFields, edgeFields } = dataset;
  const { setFieldModel } = useGraphDatasetActions();
  const itemTypes = Object.keys(metric.outputs) as ItemType[];
  const itemTypesName = itemTypes.length === 0 ? "none" : itemTypes.length === 2 ? "mixed" : itemTypes[0];
  const prefix = `statistics.${itemTypesName}.${metric.id}`;
  const fieldsIndex = {
    nodes: keyBy(nodeFields, "id"),
    edges: keyBy(edgeFields, "id"),
  };
  const [success, setSuccess] = useState<{ date: number; message: string } | null>(null);
  const [submitCount, setSubmitCount] = useState(0);
  // get metric config from the preference if it exists
  const [session, setSession] = useAtom(sessionAtom);
  const metricConfig = session.metrics[metric.id] || {
    parameters: {},
    attributeNames: {},
  };

  // default metric config
  const metricDefaultConfig = useMemo(
    () => ({
      parameters: metric.parameters.reduce(
        (iter, param) => ({
          ...iter,
          [param.id]: !isNil(param.defaultValue) ? param.defaultValue : undefined,
        }),
        {},
      ),
      attributeNames: {
        ...mapValues(metric.outputs.nodes || {}, (_, value) => value),
        ...mapValues(metric.outputs.edges || {}, (_, value) => value),
      },
    }),
    [metric],
  );

  /**
   * When the metric change
   * => we load the metric config
   */
  useEffect(() => {
    setSession((prev) => {
      const next = cloneDeep(prev);
      if (!next.metrics[metric.id]) {
        next.metrics[metric.id] = metricDefaultConfig;
        return next;
      }
      next.metrics[metric.id] = {
        parameters: {
          ...metricDefaultConfig.parameters,
          ...prev.metrics[metric.id].parameters,
        },
        attributeNames: {
          ...metricDefaultConfig.attributeNames,
          ...prev.metrics[metric.id].attributeNames,
        },
      };
      return next;
    });
  }, [metric, metricDefaultConfig, setSession]);

  /**
   * OnChange function for parameters
   */
  const onChange = useCallback(
    (type: "parameters" | "attributeNames", key: string, value: unknown) => {
      setSession((prev) => {
        const next = cloneDeep(prev);
        next.metrics[metric.id][type][key] = value;
        return next;
      });
    },
    [metric.id, setSession],
  );

  /**
   * Reset parameters for the current metric
   */
  const resetParameters = useCallback(() => {
    setSession((prev) => ({
      ...prev,
      metrics: {
        ...prev.metrics,
        [metric.id]: metricDefaultConfig,
      },
    }));
  }, [metric.id, metricDefaultConfig, setSession]);

  const setSuccessMessage = useCallback((message?: string) => {
    if (typeof message === "string") {
      setSuccess({ date: Date.now(), message });
    } else {
      setSuccess(null);
    }
  }, []);

  const submit = useCallback(() => {
    setSubmitCount((v) => v + 1);
    try {
      // compute the metric on the graph. This method mutates the state directly for performance reasons
      const { fieldModels } = computeMetric(
        metric,
        metricConfig.parameters,
        metricConfig.attributeNames,
        filteredGraph,
        dataset,
      );
      // TODO handle report
      // update fieldModel
      fieldModels.forEach(setFieldModel);
      setSuccessMessage(
        t("statistics.success", {
          items: itemTypesName,
          metrics: Object.values(metricConfig.attributeNames).join(", "),
          count: Object.values(metricConfig.attributeNames).length,
        }),
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : t("error.unknown");
      notify({
        type: "error",
        message,
        title: t("statistics.title"),
      });
    }
  }, [
    metric,
    metricConfig.parameters,
    metricConfig.attributeNames,
    filteredGraph,
    dataset,
    setFieldModel,
    setSuccessMessage,
    t,
    itemTypesName,
    notify,
  ]);

  return (
    <form
      className="panel-wrapper"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      noValidate
    >
      <h2>{t(`${prefix}.title`)}</h2>
      {metric.description && <p className="gl-text-muted">{t(`${prefix}.description`)}</p>}

      <div className="panel-block">
        {flatMap(metric.outputs, (outputs, itemType: ItemType) =>
          map(outputs, (_type, value) => (
            <StringInput
              key={`${itemType}-${value}`}
              required
              id={`statistics-${itemType}-${metric.id}-params-${value}`}
              label={t(`${prefix}.attributes.${value}`)}
              value={metricConfig.attributeNames[value]}
              onChange={(v) => onChange("attributeNames", value, v)}
              warning={
                !!fieldsIndex[itemType][metricConfig.attributeNames[value]]
                  ? t(`statistics.${itemType}_attribute_already_exists`, {
                      field: metricConfig.attributeNames[value],
                    })
                  : undefined
              }
            />
          )),
        )}
      </div>

      <div className="panel-block">
        {metric.parameters.map((param) => {
          const id = `statistics-${itemTypesName}-${metric.id}-params-${param.id}`;
          return (
            <div className="panel-block" key={id}>
              {param.type === "number" && (
                <NumberInput
                  id={id}
                  label={t(`${prefix}.parameters.${param.id}.title`)}
                  required={param.required}
                  description={param.description ? t(`${prefix}.parameters.${param.id}.description`) : undefined}
                  value={metricConfig.parameters[param.id] as number}
                  onChange={(v) => onChange("parameters", param.id, v)}
                />
              )}
              {param.type === "boolean" && (
                <BooleanInput
                  id={id}
                  label={t(`${prefix}.parameters.${param.id}.title`)}
                  required={param.required}
                  description={param.description ? t(`${prefix}.parameters.${param.id}.description`) : undefined}
                  value={metricConfig.parameters[param.id] as boolean}
                  onChange={(v) => onChange("parameters", param.id, v)}
                />
              )}
              {param.type === "enum" && (
                <EnumInput
                  id={id}
                  label={t(`${prefix}.parameters.${param.id}.title`)}
                  required={param.required}
                  description={param.description ? t(`${prefix}.parameters.${param.id}.description`) : undefined}
                  value={metricConfig.parameters[param.id] as string}
                  onChange={(v) => onChange("parameters", param.id, v)}
                  options={param.values.map(({ id }) => ({
                    value: id,
                    label: t(`${prefix}.parameters.${param.id}.values.${id}`),
                  }))}
                />
              )}
              {param.type === "attribute" && (
                <EnumInput
                  id={id}
                  label={t(`${prefix}.parameters.${param.id}.title`)}
                  required={param.required}
                  description={param.description ? t(`${prefix}.parameters.${param.id}.description`) : undefined}
                  placeholder={t("common.none")}
                  value={metricConfig.parameters[param.id] as string}
                  onChange={(v) => onChange("parameters", param.id, v)}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  options={((param.itemType === "nodes" ? nodeFields : edgeFields) as FieldModel<any>[])
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
                    {metricConfig.parameters[param.id] && (
                      <>
                        <div className="code-thumb mt-1">
                          <Highlight className="javascript">
                            {(metricConfig.parameters[param.id] as MetricScriptParameter["defaultValue"]).toString()}
                          </Highlight>
                        </div>
                        <div className="filler-fade-out position-absolute bottom-0"></div>
                      </>
                    )}
                    <div
                      className={cx(
                        metricConfig.parameters[param.id] ? "bottom-0 top-0 position-absolute w-100 h-100" : "",
                      )}
                    >
                      <button
                        type="button"
                        className="gl-btn gl-btn-outline  gl-container-highest-bg mx-auto d-block m-3"
                        onClick={() => {
                          openModal({
                            component: FunctionEditorModal<MetricScriptParameter["defaultValue"]>,
                            arguments: {
                              title: "Custom metric",
                              withSaveAndRun: true,
                              functionJsDoc: param.functionJsDoc,
                              defaultFunction: param.defaultValue,
                              value: metricConfig.parameters[param.id] as MetricScriptParameter["defaultValue"],
                              checkFunction: param.functionCheck,
                            },
                            beforeSubmit: ({ run, script }) => {
                              onChange("parameters", param.id, script);
                              if (run) setTimeout(submit, 0);
                            },
                          });
                        }}
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

      {metric.additionalControl && <metric.additionalControl {...metricConfig} submitCount={submitCount} />}

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
        <div className="flex-grow-1" />
        <button type="reset" className="gl-btn" onClick={() => resetParameters()}>
          {t("common.reset")}
        </button>
        <button type="submit" className="gl-btn gl-btn-fill">
          {t("statistics.compute", { count: Object.keys(metricConfig.attributeNames).length })}
        </button>
      </div>
    </form>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const StatisticsPanel: FC<{ metric: Metric<any> }> = ({ metric }) => {
  return <MetricForm metric={metric} />;
};
