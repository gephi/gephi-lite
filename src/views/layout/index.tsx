import { FC, PropsWithChildren } from 'react';

import { Notifications } from '../../core/notifications';
import { Modals } from '../../core/modals';
import { Header } from './Header';

export const Layout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div id="app-root">
      <Header />

      <main>{children}</main>

      <Notifications />
      <Modals></Modals>
    </div>
  );
};
