import { FC, useRef } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';

import { HomePage } from '../views/HomePage';
import { ErrorPage } from '../views/ErrorPage';
import { NotFoundPage } from '../views/NotFoundPage';
import { GraphPage } from '../views/graphPage';
import { emptyUIContext, UIContext } from './context/uiContext';

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
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/graph" element={<GraphPage />} />

          {/* Error pages: */}
          <Route path="/error" element={<ErrorPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <div id="portal-target" ref={portalTarget} />
      </UIContext.Provider>
    </HashRouter>
  );
};
