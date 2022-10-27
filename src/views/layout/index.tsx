import { FC, PropsWithChildren } from "react";

import { Header } from "./Header";
import { Modals } from "../../components/modals";
import Notifications from "../../components/notifications";

export const Layout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div id="app-root">
      <Header />
      <main>{children}</main>
      <Modals />
      <Notifications />
    </div>
  );
};
