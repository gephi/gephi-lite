import { FC } from "react";

/**
 * A fixed badge shown only on the pre-production instance, to make it obvious at a glance that this
 * is not production. It is enabled at build time by the `VITE_PREPRODUCTION` env variable, set via
 * the `.env` file at the package root: "true" on `develop`, "false" on `main_jg`. Being a checked-in
 * file (rather than only a CI-provided variable), it also takes effect for local dev builds, on
 * either branch, without needing the CI/CD pipeline.
 */
export const PreproductionBanner: FC = () => {
  if (import.meta.env.VITE_PREPRODUCTION !== "true") return null;

  return (
    <div className="preprod-banner" role="status" aria-label="Pre-production environment">
      PRÉ-PRODUCTION
    </div>
  );
};
