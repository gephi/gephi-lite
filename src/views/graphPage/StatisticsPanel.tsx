import { capitalize, cloneDeep, isNil, keyBy, map, mapValues } from "lodash";
import { FC, Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Select, { GroupBase } from "react-select";

import { InformationTooltip } from "../../components/InformationTooltip";
import MessageTooltip from "../../components/MessageTooltip";
import { StatisticsIcon } from "../../components/common-icons";
import { DEFAULT_SELECT_PROPS } from "../../components/consts";
import { ParameterInput, StringInput } from "../../components/forms/TypedInputs";
import { useFilteredGraph, useGraphDataset, useGraphDatasetActions } from "../../core/context/dataContexts";
import { computeMetric } from "../../core/metrics";
import { EDGE_METRICS, NODE_METRICS } from "../../core/metrics/collections";
import { Metric } from "../../core/metrics/types";
import { useModal } from "../../core/modals";
import { useNotifications } from "../../core/notifications";
import { sessionAtom } from "../../core/session";
import { ItemType } from "../../core/types";
import { useAtom } from "../../core/utils/atoms";

type MetricOption = {
  // id/name of the metric
  value: string;
  // metric for node or edge ?
  itemType: ItemType;
  // label displayed in the UI for the metric
  label: string;
  // metric's value
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metric: Metric<any, any>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const MetricForm: FC<{ metric: Metric<any, any>; onClose: () => void }> = ({ metric }) => {
  const { t } = useTranslation();
  const { notify } = useNotifications();
  const filteredGraph = useFilteredGraph();
  const dataset = useGraphDataset();
  const { nodeFields, edgeFields } = dataset;
  const { setGraphDataset } = useGraphDatasetActions();
  const fieldsIndex = keyBy(metric.itemType === "nodes" ? nodeFields : edgeFields, "id");
  const [success, setSuccess] = useState<{ date: number; message: string } | null>(null);
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
      attributeNames: mapValues(metric.outputs, (type, value) => value),
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
    try {
      const res = computeMetric(metric, metricConfig.parameters, metricConfig.attributeNames, filteredGraph, dataset);
      setGraphDataset(res.dataset);
      setSuccessMessage(
        t("statistics.success", {
          items: metric.itemType,
          metrics: Object.values(metricConfig.attributeNames).join(", "),
          count: Object.values(metricConfig.attributeNames).length,
        }) as string,
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : t("error.unknown");
      notify({
        type: "error",
        message,
        title: t("statistics.title") as string,
      });
    }
  }, [
    metric,
    metricConfig.parameters,
    metricConfig.attributeNames,
    filteredGraph,
    dataset,
    setGraphDataset,
    setSuccessMessage,
    t,
    notify,
  ]);

  return (
    <form
      className="panel-wrapper"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="panel-block-grow">
        <h3 className="fs-5">{t(`statistics.${metric.itemType}.${metric.id}.title`)}</h3>
        {metric.description && (
          <p className="text-muted small">{t(`statistics.${metric.itemType}.${metric.id}.description`)}</p>
        )}

        <div className="my-3">
          {map(metric.outputs, (_type, value) => (
            <Fragment key={value}>
              <StringInput
                required
                id={`statistics-${metric.itemType}-${metric.id}-params-${value}`}
                label={t(`statistics.${metric.itemType}.${metric.id}.attributes.${value}`) as string}
                value={metricConfig.attributeNames[value]}
                onChange={(v) => onChange("attributeNames", value, v)}
                warning={
                  !!fieldsIndex[metricConfig.attributeNames[value]]
                    ? (t(`statistics.${metric.itemType}_attribute_already_exists`, {
                        field: metricConfig.attributeNames[value],
                      }) as string)
                    : undefined
                }
              />
            </Fragment>
          ))}
        </div>

        {metric.parameters.map((param) => {
          const id = `statistics-${metric.itemType}-${metric.id}-params-${param.id}`;
          return (
            <div className="my-1" key={id}>
              <ParameterInput
                param={param}
                value={metricConfig.parameters[param.id]}
                onChange={(v) => onChange("parameters", param.id, v)}
              />
            </div>
          );
        })}
      </div>

      <hr className="m-0" />

      <div className="z-over-loader panel-block d-flex flex-row align-items-center">
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
    <>
      <div className="panel-block">
        <h2 className="fs-4 d-flex align-items-center gap-1">
          <StatisticsIcon className="me-1" /> {t("statistics.title")}{" "}
          <InformationTooltip>
            <p className="text-muted small m-0">{t("statistics.description")}</p>
          </InformationTooltip>
        </h2>
        <p className="text-muted small d-none d-md-block">{t("statistics.description")}</p>

        <Select<MetricOption, false>
          {...DEFAULT_SELECT_PROPS}
          options={options}
          value={option}
          onChange={setOption}
          placeholder={t("statistics.placeholder")}
        />
      </div>

      {option?.metric && (
        <>
          <hr className="m-0" />
          <MetricForm key={option.metric.id} metric={option.metric} onClose={() => setOption(null)} />
        </>
      )}
    </>
  );
};
