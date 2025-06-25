import cx from "classnames";
import { FC, PropsWithChildren } from "react";

import { Modals } from "../../components/modals";
import Notifications from "../../components/notifications";
import { Header } from "./Header";

interface LayoutProps {
  id?: string;
  className?: string;
}
export const Layout: FC<PropsWithChildren<LayoutProps>> = ({ children, className, id }) => {
  return (
    <>
      <Header />
      <main id={id} className={cx("container-fluid", className)}>
        {children}
      </main>
      <Modals />
      <Notifications />
    </>
  );
};
