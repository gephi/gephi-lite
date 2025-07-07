import cx from "classnames";
import { CSSProperties, FC } from "react";
import { useTranslation } from "react-i18next";

import { useConnectedUser } from "../../core/user";
import { UserIcon } from "../common-icons";

export const UserAvatar: FC<{ className?: string; style?: CSSProperties }> = ({ className, style }) => {
  const [user] = useConnectedUser();
  const { t } = useTranslation();

  return (
    <div className={cx("user", className)} style={style}>
      {user && user.avatar ? (
        <>
          <img src={user.avatar} alt={t("user.avatar_alt", { name: user.name }).toString()} />
          {user.provider && (
            <span style={{ padding: "2px" }} className="position-absolute translate-middle badge rounded-pill bg-dark">
              {user.provider.icon}
            </span>
          )}
        </>
      ) : (
        <UserIcon className="default" />
      )}
    </div>
  );
};
