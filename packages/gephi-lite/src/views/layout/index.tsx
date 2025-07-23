import cx from "classnames";
import { FC, PropsWithChildren } from "react";

import { Modals } from "../../components/modals";
import Notifications from "../../components/notifications";

interface LayoutProps {
  id?: string;
  className?: string;
}
export const Layout: FC<PropsWithChildren<LayoutProps>> = ({ children, className, id }) => {
  return (
    <>
      <main id={id} className={cx("container-fluid", className)}>
        {children}
      </main>
      <Modals />
      <Notifications />
    </>
  );
};
