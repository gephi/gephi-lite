import { FC } from "react";

/**
 * A fixed badge shown only on the pre-production instance, to make it obvious at a glance that this
 * is not production. It is enabled at build time by the `VITE_PREPRODUCTION` env variable, which is
 * set only by the pre-production deployment workflow.
 */
export const PreproductionBanner: FC = () => {
  if (!import.meta.env.VITE_PREPRODUCTION) return null;

  return (
    <div className="preprod-banner" role="status" aria-label="Pre-production environment">
      PRÉ-PRODUCTION
    </div>
  );
};
