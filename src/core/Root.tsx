import { FC, useMemo } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";

import { ErrorPage } from "../views/ErrorPage";
import { NotFoundPage } from "../views/NotFoundPage";
import { GraphPage } from "../views/graphPage";
import { UIContext, emptyUIContext } from "./context/uiContext";
import { AtomsContextsRoot } from "./context/dataContexts";
import { Initialize } from "./Initialize";

export const Root: FC = () => {
  const portalTarget = useMemo(() => document.getElementById("portal-target") as HTMLDivElement, []);

  return (
    <HashRouter>
      <UIContext.Provider
        value={{
          ...emptyUIContext,
          portalTarget: portalTarget,
        }}
      >
        <AtomsContextsRoot>
          <Initialize>
            <Routes>
              <Route path="/" element={<GraphPage />} />

              {/* Error pages: */}
              <Route path="/error" element={<ErrorPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Initialize>
        </AtomsContextsRoot>
      </UIContext.Provider>
    </HashRouter>
  );
};
