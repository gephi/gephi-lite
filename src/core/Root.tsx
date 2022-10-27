import { FC, useRef } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";

import { HomePage } from "../views/HomePage";
import { ErrorPage } from "../views/ErrorPage";
import { NotFoundPage } from "../views/NotFoundPage";
import { GraphPage } from "../views/graphPage";
import { UIContext, emptyUIContext } from "./context/uiContext";
import { dataContext, dataContextValue } from "./context/dataContext";
import { actionsContext, actionsContextValue } from "./context/actionsContext";

export const Root: FC = () => {
  const portalTarget = useRef<HTMLDivElement>(null);
  return (
    <HashRouter>
      <UIContext.Provider
        value={{
          ...emptyUIContext,
          portalTarget: portalTarget.current || emptyUIContext.portalTarget,
        }}
      >
        <actionsContext.Provider value={actionsContextValue}>
          <dataContext.Provider value={dataContextValue}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/graph" element={<GraphPage />} />

              {/* Error pages: */}
              <Route path="/error" element={<ErrorPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            <div id="portal-target" ref={portalTarget} />
          </dataContext.Provider>
        </actionsContext.Provider>
      </UIContext.Provider>
    </HashRouter>
  );
};
