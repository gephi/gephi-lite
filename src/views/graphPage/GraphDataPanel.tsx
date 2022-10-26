import { FC } from "react";
import { GraphMetadataForm } from "../../components/forms/GraphMetadataForm";
import { GraphPartitioning } from "../../components/GraphPartitioning";

export const GraphDataPanel: FC = () => {
  return (
    <div>
      <h4>Metadata</h4>
      <GraphMetadataForm />
      <h4>Partitioning</h4>
      <GraphPartitioning />
    </div>
  );
};
