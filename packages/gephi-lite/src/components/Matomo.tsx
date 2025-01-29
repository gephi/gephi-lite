import { MatomoProvider as MatomoProviderOrginal, createInstance, useMatomo } from "@datapunt/matomo-tracker-react";
import { MatomoInstance } from "@datapunt/matomo-tracker-react/lib/types";
import { FC, PropsWithChildren, useEffect, useMemo } from "react";
import { useLocation } from "react-router";

import { config } from "../config";

/**
 * Fix definition of MatomoProvider to allow children
 */
type MatomoProviderFixedType = FC<PropsWithChildren<{ value: MatomoInstance }>>;
const MatomoProviderFixed: MatomoProviderFixedType = MatomoProviderOrginal as MatomoProviderFixedType;

/**
 * Component to track page changes
 */
export const MatomoTracker: FC = () => {
  const { trackPageView } = useMatomo();
  const location = useLocation();

  useEffect(() => {
    trackPageView({});
  }, [trackPageView, location]);

  return null;
};

export const MatomoProvider: FC<PropsWithChildren<unknown>> = ({ children }) => {
  const instance = useMemo(() => {
    if (config.matomo.urlBase) return createInstance(config.matomo);
    return null;
  }, []);

  return (
    <>
      {instance ? (
        <MatomoProviderFixed value={instance}>
          {children}
          <MatomoTracker />
        </MatomoProviderFixed>
      ) : (
        <>{children}</>
      )}
    </>
  );
};
