import { FC, PropsWithChildren } from "react";

import { Modals } from "../../components/modals";
import Notifications from "../../components/notifications";

export const Layout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div id="app-root">
      <main>{children}</main>
      <Modals />
      <Notifications />
    </div>
  );
};
