import { FC, useMemo } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { HashRouter, Route, Routes } from "react-router-dom";

import { ErrorComponent } from "../components/Error";
import { MatomoProvider } from "../components/Matomo";
import DesignSystemPage from "../designSystem";
import { NotFoundPage } from "../views/NotFoundPage";
import { DataPage } from "../views/dataPage";
import { GraphPage } from "../views/graphPage";
import { Initialize } from "./Initialize";
import { AtomsContextsRoot } from "./context/dataContexts";
import { UIContext, emptyUIContext } from "./context/uiContext";

export const Root: FC = () => {
  const portalTarget = useMemo(() => document.getElementById("portal-target") as HTMLDivElement, []);

  return (
    <ErrorBoundary
      FallbackComponent={ErrorComponent}
      onReset={(details) => {
        // Reset the state of your app so the error doesn't happen again
        console.debug(details);
      }}
    >
      <HashRouter>
        <MatomoProvider>
          <UIContext.Provider
            value={{
              ...emptyUIContext,
              portalTarget: portalTarget,
            }}
          >
            <AtomsContextsRoot>
              <Initialize>
                <Routes>
                  <Route path="/design-system" element={<DesignSystemPage />} />
                  <Route path="/design-system/:page" element={<DesignSystemPage />} />
                  <Route path="/" element={<GraphPage />} />
                  <Route path="/data/nodes" element={<DataPage type="nodes" />} />
                  <Route path="/data/edges" element={<DataPage type="edges" />} />

                  {/* Error pages: */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Initialize>
            </AtomsContextsRoot>
          </UIContext.Provider>
        </MatomoProvider>
      </HashRouter>
    </ErrorBoundary>
  );
};
