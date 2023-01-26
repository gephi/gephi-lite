import { capitalize, keyBy, map, mapValues } from "lodash";
import { FC, Fragment, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Select, { GroupBase } from "react-select";

import { ItemType } from "../../core/types";
import { StatisticsIcon } from "../../components/common-icons";
import { EDGE_METRICS, NODE_METRICS } from "../../core/metrics/collections";
import { Metric } from "../../core/metrics/types";
import { useNotifications } from "../../core/notifications";
import { BooleanInput, EnumInput, NumberInput, StringInput } from "../../components/forms/TypedInputs";
import { useGraphDataset, useGraphDatasetActions, useSigmaGraph } from "../../core/context/dataContexts";
import { FieldModel } from "../../core/graph/types";
import { computeMetric } from "../../core/metrics";

type MetricOption = {
  value: string;
  itemType: ItemType;
  label: string;
  metric: Metric<any, any, any>;
};

export const MetricForm: FC<{ metric: Metric<any, any, any>; onClose: () => void }> = ({ metric, onClose }) => {
  const { t } = useTranslation();
  const { notify } = useNotifications();
  const sigmaGraph = useSigmaGraph();
  const dataset = useGraphDataset();
  const { nodeFields, edgeFields } = dataset;
  const { setGraphDataset } = useGraphDatasetActions();
  const [paramsState, setParamsState] = useState<Record<string, unknown>>(
    metric.parameters.reduce(
      (iter, param) => ({
        ...iter,
        [param.id]: param.defaultValue || undefined,
      }),
      {},
    ),
  );

  const fieldsIndex = keyBy(metric.itemType === "nodes" ? nodeFields : edgeFields, "id");
  const [attributeNames, setAttributeNames] = useState<Record<string, string>>(
    mapValues(metric.types, (type, value) => value),
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();

        try {
          const res = computeMetric(metric, paramsState, attributeNames, sigmaGraph, dataset);
          setGraphDataset(res.dataset);
          notify({
            type: "success",
            message: t("statistics.success", {
              items: metric.itemType,
              metrics: Object.values(attributeNames).join(", "),
              count: Object.values(attributeNames).length,
            }) as string,
            title: t("statistics.title") as string,
          });
          onClose();
        } catch (e) {
          const message = e instanceof Error ? e.message : "unknown error";
          notify({
            type: "error",
            message,
            title: t("statistics.title") as string,
          });
        }
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
              value={attributeNames[value]}
              onChange={(v) => setAttributeNames((s) => ({ ...s, [value]: v }))}
            />
            {!!fieldsIndex[attributeNames[value]] && (
              <div className="small text-primary">
                {t(`statistics.${metric.itemType}_attribute_already_exists`, { field: attributeNames[value] })}
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
                value={paramsState[param.id] as number}
                onChange={(v) => setParamsState((s) => ({ ...s, [param.id]: v }))}
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
                value={paramsState[param.id] as boolean}
                onChange={(v) => setParamsState((s) => ({ ...s, [param.id]: v }))}
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
                value={paramsState[param.id] as string}
                onChange={(v) => setParamsState((s) => ({ ...s, [param.id]: v }))}
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
                value={paramsState[param.id] as string}
                onChange={(v) => setParamsState((s) => ({ ...s, [param.id]: v }))}
                options={((param.itemType === "nodes" ? nodeFields : edgeFields) as FieldModel<any>[])
                  .filter((field) => (param.restriction ? !!field[param.restriction] : true))
                  .map((field) => ({
                    value: field.id,
                    label: field.id,
                  }))}
              />
            )}
          </div>
        );
      })}

      <div className="text-end mt-2">
        <button type="button" className="btn btn-outline-secondary ms-2" onClick={() => onClose()}>
          {t("common.cancel")}
        </button>
        <button type="submit" className="btn btn-primary ms-2">
          {t("statistics.compute", { count: Object.keys(attributeNames).length })}
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
