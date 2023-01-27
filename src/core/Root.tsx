import { FC, useRef } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";

import { ErrorPage } from "../views/ErrorPage";
import { NotFoundPage } from "../views/NotFoundPage";
import { GraphPage } from "../views/graphPage";
import { UIContext, emptyUIContext } from "./context/uiContext";
import { AtomsContextsRoot } from "./context/dataContexts";
import { AuthInit } from "./user/AuthInit";

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
        <AtomsContextsRoot>
          <AuthInit />
          <Routes>
            <Route path="/" element={<GraphPage />} />

            {/* Error pages: */}
            <Route path="/error" element={<ErrorPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          <div id="portal-target" ref={portalTarget} />
        </AtomsContextsRoot>
      </UIContext.Provider>
    </HashRouter>
  );
};
