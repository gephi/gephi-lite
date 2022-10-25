import { FC, useRef } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";

import { AppContextProvider } from "./context";
import { HomePage } from "../views/HomePage";
import { ErrorPage } from "../views/ErrorPage";
import { NotFoundPage } from "../views/NotFoundPage";

export const Root: FC = () => {
  const portalTarget = useRef<HTMLDivElement>(null);
  return (
    <HashRouter>
      <AppContextProvider init={{ portalTarget: portalTarget.current }}>
        <Routes>
          <Route path="/" element={<HomePage />} />

          {/* Error pages: */}
          <Route path="/error" element={<ErrorPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <div id="portal-target" ref={portalTarget} />
      </AppContextProvider>
    </HashRouter>
  );
};
