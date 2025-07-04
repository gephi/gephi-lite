import { FC } from "react";
import { useTranslation } from "react-i18next";

import { useGraphDataset, useGraphDatasetActions } from "../../core/context/dataContexts";
import { Select } from "./Select";

const GraphTypeValues = ["directed", "undirected", "mixed"] as const;

export const GraphMetadataForm: FC = () => {
  const { metadata } = useGraphDataset();
  const { setGraphMeta } = useGraphDatasetActions();
  const { t } = useTranslation();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setGraphMeta(metadata);
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
          value={metadata?.title || ""}
          onChange={(e) => {
            setGraphMeta({ ...metadata, title: e.target.value });
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
          value={metadata?.description || ""}
          onChange={(e) => {
            setGraphMeta({
              ...metadata,
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
          value={metadata?.keywords || ""}
          onChange={(e) => {
            setGraphMeta({
              ...metadata,
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
          value={metadata?.authors || ""}
          onChange={(e) => {
            setGraphMeta({ ...metadata, authors: e.target.value });
          }}
        />
      </div>
      <div className="mb-2">
        <label htmlFor="graph-type" className="form-label">
          {t("graph.metadata.graph-type")}
        </label>
        <Select
          id="graph-type"
          value={{ value: metadata?.type || "mixed", label: t(`graph.model.${metadata?.type || "mixed"}`) }}
          options={GraphTypeValues.map((v) => ({ value: v, label: t(`graph.model.${v}`) }))}
          onChange={(e) => setGraphMeta({ ...metadata, type: e ? e.value : "mixed" })}
        />
      </div>
    </form>
  );
};
