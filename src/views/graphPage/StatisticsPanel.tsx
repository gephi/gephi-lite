import { capitalize, keyBy, map, mapValues, isNil, cloneDeep } from "lodash";
import { FC, Fragment, useMemo, useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Select, { GroupBase } from "react-select";
import Highlight from "react-highlight";
import cx from "classnames";

import { ItemType } from "../../core/types";
import { useAtom } from "../../core/utils/atoms";
import { sessionAtom } from "../../core/session";
import { useNotifications } from "../../core/notifications";
import { EDGE_METRICS, NODE_METRICS } from "../../core/metrics/collections";
import { Metric, MetricScriptParameter } from "../../core/metrics/types";
import { computeMetric } from "../../core/metrics";
import { BooleanInput, EnumInput, NumberInput, StringInput } from "../../components/forms/TypedInputs";
import { useGraphDataset, useGraphDatasetActions, useSigmaGraph } from "../../core/context/dataContexts";
import { FieldModel } from "../../core/graph/types";
import { useModal } from "../../core/modals";
import { CodeEditorIcon, StatisticsIcon } from "../../components/common-icons";
import { FunctionEditorModal } from "./modals/FunctionEditorModal";

type MetricOption = {
  value: string;
  itemType: ItemType;
  label: string;
  metric: Metric<any, any, any>;
};

export const MetricForm: FC<{ metric: Metric<any, any, any>; onClose: () => void }> = ({ metric, onClose }) => {
  const { t } = useTranslation();
  const { notify } = useNotifications();
  const { openModal } = useModal();
  const sigmaGraph = useSigmaGraph();
  const dataset = useGraphDataset();
  const { nodeFields, edgeFields } = dataset;
  const { setGraphDataset } = useGraphDatasetActions();
  const fieldsIndex = keyBy(metric.itemType === "nodes" ? nodeFields : edgeFields, "id");
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
      attributeNames: mapValues(metric.types, (type, value) => value),
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

  const submit = useCallback(() => {
    try {
      const res = computeMetric(metric, metricConfig.parameters, metricConfig.attributeNames, sigmaGraph, dataset);
      setGraphDataset(res.dataset);
      notify({
        type: "success",
        message: t("statistics.success", {
          items: metric.itemType,
          metrics: Object.values(metricConfig.attributeNames).join(", "),
          count: Object.values(metricConfig.attributeNames).length,
        }) as string,
        title: t("statistics.title") as string,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "unknown error";
      notify({
        type: "error",
        message,
        title: t("statistics.title") as string,
      });
    }
  }, [notify, setGraphDataset, dataset, metric, metricConfig.attributeNames, metricConfig.parameters, sigmaGraph, t]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <h3 className="fs-5 mt-3">{t(`statistics.${metric.itemType}.${metric.id}.title`)}</h3>
      {metric.description && (
        <p className="text-muted small">{t(`statistics.${metric.itemType}.${metric.id}.description`)}</p>
      )}

      <div className="my-3">
        {map(metric.types, (_type, value) => (
          <Fragment key={value}>
            <StringInput
              required
              id={`statistics-${metric.itemType}-${metric.id}-params-${value}`}
              label={t(`statistics.${metric.itemType}.${metric.id}.attributes.${value}`) as string}
              value={metricConfig.attributeNames[value]}
              onChange={(v) => onChange("attributeNames", value, v)}
            />
            {!!fieldsIndex[metricConfig.attributeNames[value]] && (
              <div className="small text-primary">
                {t(`statistics.${metric.itemType}_attribute_already_exists`, {
                  field: metricConfig.attributeNames[value],
                })}
              </div>
            )}
          </Fragment>
        ))}
      </div>

      {metric.parameters.map((param) => {
        const id = `statistics-${metric.itemType}-${metric.id}-params-${param.id}`;
        return (
          <div className="my-1" key={id}>
            {param.type === "number" && (
              <NumberInput
                id={id}
                label={t(`statistics.${metric.itemType}.${metric.id}.parameters.${param.id}.title`) as string}
                required={param.required}
                description={
                  param.description
                    ? (t(`statistics.${metric.itemType}.${metric.id}.parameters.${param.id}.description`) as string)
                    : undefined
                }
                value={metricConfig.parameters[param.id] as number}
                onChange={(v) => onChange("parameters", param.id, v)}
              />
            )}
            {param.type === "boolean" && (
              <BooleanInput
                id={id}
                label={t(`statistics.${metric.itemType}.${metric.id}.parameters.${param.id}.title`) as string}
                required={param.required}
                description={
                  param.description
                    ? (t(`statistics.${metric.itemType}.${metric.id}.parameters.${param.id}.description`) as string)
                    : undefined
                }
                value={metricConfig.parameters[param.id] as boolean}
                onChange={(v) => onChange("parameters", param.id, v)}
              />
            )}
            {param.type === "enum" && (
              <EnumInput
                id={id}
                label={t(`statistics.${metric.itemType}.${metric.id}.parameters.${param.id}.title`) as string}
                required={param.required}
                description={
                  param.description
                    ? (t(`statistics.${metric.itemType}.${metric.id}.parameters.${param.id}.description`) as string)
                    : undefined
                }
                value={metricConfig.parameters[param.id] as string}
                onChange={(v) => onChange("parameters", param.id, v)}
                options={param.values.map(({ id }) => ({
                  value: id,
                  label: t(`statistics.${metric.itemType}.${metric.id}.parameters.${param.id}.values.${id}`) as string,
                }))}
              />
            )}
            {param.type === "attribute" && (
              <EnumInput
                id={id}
                label={t(`statistics.${metric.itemType}.${metric.id}.parameters.${param.id}.title`) as string}
                required={param.required}
                description={
                  param.description
                    ? (t(`statistics.${metric.itemType}.${metric.id}.parameters.${param.id}.description`) as string)
                    : undefined
                }
                placeholder={t("common.none") as string}
                value={metricConfig.parameters[param.id] as string}
                onChange={(v) => onChange("parameters", param.id, v)}
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
                  <div className={cx(metricConfig.parameters[param.id] ? "bottom-0 position-absolute w-100" : "")}>
                    <button
                      type="button"
                      className="btn btn-dark mx-auto d-block m-3"
                      onClick={() =>
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
        <button type="reset" className="btn btn-outline-secondary ms-2" onClick={() => resetParameters()}>
          {t("common.reset")}
        </button>
        <button type="submit" className="btn btn-primary ms-2">
          {t("statistics.compute", { count: Object.keys(metricConfig.attributeNames).length })}
        </button>
      </div>
    </form>
  );
};

export const StatisticsPanel: FC = () => {
  const { t } = useTranslation();

  const options: GroupBase<MetricOption>[] = useMemo(
    () => [
      {
        label: capitalize(t("graph.model.nodes") as string),
        options: NODE_METRICS.map((metric) => ({
          value: metric.id,
          itemType: "nodes",
          label: t(`statistics.nodes.${metric.id}.title`),
          metric,
        })),
      },
      {
        label: capitalize(t("graph.model.edges") as string),
        options: EDGE_METRICS.map((metric) => ({
          value: metric.id,
          itemType: "edges",
          label: t(`statistics.edges.${metric.id}.title`),
          metric,
        })),
      },
    ],
    [t],
  );
  const [option, setOption] = useState<MetricOption | null>(null);

  return (
    <div>
      <h2 className="fs-4">
        <StatisticsIcon className="me-1" /> {t("statistics.title")}
      </h2>
      <p className="text-muted small">{t("statistics.description")}</p>

      <Select<MetricOption, false>
        options={options}
        value={option}
        onChange={setOption}
        placeholder={t("statistics.placeholder")}
      />

      {option?.metric && (
        <>
          <hr />
          <MetricForm key={option.metric.id} metric={option.metric} onClose={() => setOption(null)} />
        </>
      )}
    </div>
  );
};
