import { useAtom } from "@ouestware/atoms";
import { cloneDeep, flatMap, isNil, keyBy, map, mapValues } from "lodash";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import MessageAlert from "../../../components/MessageAlert";
import { ResetIcon } from "../../../components/common-icons";
import { BooleanInput, EnumInput, NumberInput, StringInput } from "../../../components/forms/TypedInputs";
import { useFilteredGraph, useGraphDataset, useGraphDatasetActions } from "../../../core/context/dataContexts";
import { FieldModel } from "../../../core/graph/types";
import { computeMetric } from "../../../core/metrics";
import { Metric } from "../../../core/metrics/types";
import { useNotifications } from "../../../core/notifications";
import { sessionAtom } from "../../../core/session";
import { ItemType } from "../../../core/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const MetricForm: FC<{ metric: Metric<any>; onClose?: () => void }> = ({ metric }) => {
  const { t } = useTranslation();
  const { notify } = useNotifications();
  const filteredGraph = useFilteredGraph();
  const dataset = useGraphDataset();
  const { nodeFields, edgeFields } = dataset;
  const { setFieldModel } = useGraphDatasetActions();
  const itemTypes = Object.keys(metric.outputs) as ItemType[];
  const itemTypesName = itemTypes.length === 0 ? "none" : itemTypes.length === 2 ? "mixed" : itemTypes[0];
  const prefix = `metrics.${itemTypesName}.${metric.id}`;
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
      const { fields } = computeMetric(
        metric,
        metricConfig.parameters,
        metricConfig.attributeNames,
        filteredGraph,
        dataset,
      );
      // TODO handle report
      fields.forEach(({ model, values }) => setFieldModel(model, values));
      setSuccessMessage(
        t("metrics.success", {
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
        title: t("metrics.title"),
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
      <div className="panel-body">
        <h2>{t(`${prefix}.title`)}</h2>
        {metric.description && <p className="gl-text-muted">{t(`${prefix}.description`)}</p>}

        <div className="panel-block">
          {flatMap(metric.outputs, (outputs, itemType: ItemType) =>
            map(outputs, (_type, value) => (
              <StringInput
                key={`${itemType}-${value}`}
                required
                id={`metrics-${itemType}-${metric.id}-params-${value}`}
                label={t(`${prefix}.attributes.${value}`)}
                value={metricConfig.attributeNames[value]}
                onChange={(v) => onChange("attributeNames", value, v)}
                warning={
                  !!fieldsIndex[itemType][metricConfig.attributeNames[value]]
                    ? t(`metrics.${itemType}_attribute_already_exists`, {
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
            const id = `metrics-${itemTypesName}-${metric.id}-params-${param.id}`;
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
              </div>
            );
          })}
        </div>
        {metric.additionalControl && <metric.additionalControl {...metricConfig} submitCount={submitCount} />}
      </div>

      <div className="panel-footer">
        {success && (
          <MessageAlert key={success.date} message={<p className="gl-m-0">{success.message}</p>} type="success" />
        )}
        <div className="gl-actions">
          <button
            type="reset"
            className="gl-btn gl-btn-outline gl-btn-icon"
            title={t("common.reset")}
            onClick={() => resetParameters()}
          >
            <ResetIcon />
          </button>
          <button type="submit" className="gl-btn gl-btn-fill">
            {t("metrics.compute", { count: Object.keys(metricConfig.attributeNames).length })}
          </button>
        </div>
      </div>
    </form>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const MetricsPanel: FC<{ metric: Metric<any> }> = ({ metric }) => {
  return <MetricForm metric={metric} />;
};
