import { FC } from "react";

/**
 * A fixed badge shown only on the pre-production instance, to make it obvious at a glance that this
 * is not production. Detected purely from the deployed URL: the pre-production workflow publishes
 * the app under a `/preprod/` sub-path (see deploy-app-preprod.yml), which production never has.
 */
export const PreproductionBanner: FC = () => {
  if (!window.location.pathname.includes("/preprod/")) return null;

  return (
    <div className="preprod-banner" role="status" aria-label="Pre-production environment">
      PRÉ-PRODUCTION
    </div>
  );
};
