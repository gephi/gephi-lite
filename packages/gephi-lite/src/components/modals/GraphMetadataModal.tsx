import { GraphMetadata } from "@gephi/gephi-lite-sdk";
import { useDebounce } from "@ouestware/hooks";
import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useGraphDataset, useGraphDatasetActions } from "../../core/context/dataContexts";
import { ModalProps } from "../../core/modals/types";
import { Select } from "../forms/Select";
import { Modal } from "../modals";

const GraphTypeValues = ["directed", "undirected", "mixed"] as const;

export const GraphMetadataModal: FC<ModalProps<unknown>> = ({ cancel }) => {
  const { t } = useTranslation();
  const { metadata } = useGraphDataset();
  const { setGraphMeta } = useGraphDatasetActions();
  // init but do not sync in a useEffect because of debounce
  const [state, setState] = useState<GraphMetadata>(metadata);
  const [debouncedState] = useDebounce(state);

  useEffect(() => {
    //if (!isEqual(debouncedState, metadata))
    setGraphMeta(debouncedState);
  }, [debouncedState, setGraphMeta]);

  return (
    <Modal title={t("cloud.github.auth.title")} onClose={() => cancel()}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
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
          <label htmlFor="graph-keywords" className="form-label">
            {t("graph.metadata.keywords")}
          </label>
          <input
            id="graph-keywords"
            className="form-control"
            type="text"
            value={state?.keywords || ""}
            onChange={(e) => {
              setState({
                ...state,
                keywords: e.target.value,
              });
            }}
          />
        </div>
        <div className="mb-2">
          <label htmlFor="graph-authors" className="form-label">
            {t("graph.metadata.authors")}
          </label>
          <input
            className="form-control"
            id="graph-authors"
            type="text"
            value={state?.authors || ""}
            onChange={(e) => {
              setState({ ...state, authors: e.target.value });
            }}
          />
        </div>
        <div className="mb-2">
          <label htmlFor="graph-type" className="form-label">
            {t("graph.metadata.graph-type")}
          </label>
          <Select
            id="graph-type"
            value={{ value: state?.type || "mixed", label: t(`graph.model.${state?.type || "mixed"}`) }}
            options={GraphTypeValues.map((v) => ({ value: v, label: t(`graph.model.${v}`) }))}
            onChange={(e) => setState({ ...state, type: e ? e.value : "mixed" })}
          />
        </div>
      </form>
      <div className="gl-gap-2 d-flex">
        <button
          className="gl-btn gl-btn-fill"
          type="button"
          onClick={() => {
            cancel();
          }}
        >
          {t("common.close")}
        </button>
      </div>
    </Modal>
  );
};
