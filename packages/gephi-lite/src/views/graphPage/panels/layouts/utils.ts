import { FieldModel } from "@gephi/gephi-lite-sdk";
import { isNil, pickBy } from "lodash";

import { Layout } from "../../../../core/layouts/types";

/**
 * Drops nil values and attribute values that don't match an existing field, so
 * they don't override defaults and inferred settings.
 */
export const getValidStoredParameters = (
  layout: Pick<Layout, "parameters">,
  params: Record<string, unknown>,
  nodeFields: FieldModel[],
  edgeFields: FieldModel[],
) =>
  pickBy(params, (value, key) => {
    if (isNil(value)) return false;
    const param = layout.parameters.find((p) => p.id === key);
    return (
      param?.type !== "attribute" || (param.itemType === "nodes" ? nodeFields : edgeFields).some((f) => f.id === value)
    );
  });
