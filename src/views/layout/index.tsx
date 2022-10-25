import { FC, PropsWithChildren } from "react";

import { Notifications } from "../../core/notifications";
import { Modals } from "../../core/modals";
import { Header } from "./Header";
import { Footer } from "./Footer";

export const Layout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div id="app-root">
      <Header />

      <main className="container">
        <div className="row">{children}</div>
      </main>

      <Notifications />
      <Modals></Modals>

      <Footer />
    </div>
  );
};
