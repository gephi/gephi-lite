import { GraphMetadata } from "@gephi/gephi-lite-sdk";
import { GraphType } from "graphology-types";
import { omit } from "lodash";
import { FC, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { useGraphDataset, useGraphDatasetActions } from "../../core/context/dataContexts";
import { ModalProps } from "../../core/modals/types";
import { InvalidDataIcon } from "../common-icons";
import { Select } from "../forms/Select";
import { Modal } from "../modals";

const GRAPH_TYPES = ["directed", "undirected", "mixed"] as const;
const FORM_TITLE = "graph-metadata";

export const GraphMetadataModal: FC<ModalProps> = ({ cancel, submit }) => {
  const { t } = useTranslation();
  const { metadata, fullGraph } = useGraphDataset();
  const { setGraphMeta, setGraphType } = useGraphDatasetActions();
  const [state, setState] = useState<GraphMetadata & { type: GraphType }>(() => ({
    ...metadata,
    type: fullGraph.type,
  }));

  const handleSubmit = useCallback(() => {
    setGraphMeta(omit(state, "type"));
    if (fullGraph.type !== state.type) setGraphType(state.type);

    submit({});
  }, [fullGraph.type, setGraphMeta, setGraphType, state, submit]);

  return (
    <Modal title={t("graph.metadata.title")} onClose={() => cancel()}>
      <form
        id={FORM_TITLE}
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <div className="mb-2">
          <label htmlFor="graph-title" className="form-label">
            {t("graph.metadata.graph-title")}
          </label>
          <input
            className="form-control"
            id="graph-title"
            type="text"
            value={state?.title || ""}
            onChange={(e) => {
              setState({ ...state, title: e.target.value });
            }}
          />
        </div>
        <div className="mb-2">
          <label htmlFor="graph-description" className="form-label">
            {t("graph.metadata.description")}
          </label>
          <textarea
            className="form-control"
            id="graph-description"
            value={state?.description || ""}
            onChange={(e) => {
              setState({
                ...state,
                description: e.target.value,
              });
            }}
          />
        </div>
        <div className="mb-2">
          <label htmlFor="graph-type" className="form-label">
            {t("graph.metadata.graph-type")}
          </label>
          <Select
            required
            id="graph-type"
            value={{ value: state?.type || "mixed", label: t(`graph.model.${state?.type || "mixed"}`) }}
            options={GRAPH_TYPES.map((v) => ({ value: v, label: t(`graph.model.${v}`) }))}
            onChange={(o) => setState({ ...state, type: o?.value || "mixed" })}
          />
          {fullGraph.type === "mixed" && state.type !== "mixed" && (
            <div className="text-muted small mt-2">
              <InvalidDataIcon /> {t(`graph.metadata.graph-type-${state.type}-warning`)}.
            </div>
          )}
        </div>
      </form>
      <div className="gl-gap-2 d-flex">
        <button
          className="gl-btn gl-btn-outline"
          type="button"
          onClick={() => {
            cancel();
          }}
        >
          {t("common.close")}
        </button>
        <button className="gl-btn gl-btn-fill" type="submit" form={FORM_TITLE}>
          {t("common.submit")}
        </button>
      </div>
    </Modal>
  );
};
