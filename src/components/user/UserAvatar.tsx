import { FC, CSSProperties } from "react";
import cx from "classnames";
import { FaUser } from "react-icons/fa";
import { useTranslation } from "react-i18next";

import { useConnectedUser } from "../../core/user";

export const UserAvatar: FC<{ className?: string; style?: CSSProperties }> = ({ className, style }) => {
  const [user] = useConnectedUser();
  const { t } = useTranslation();

  return (
    <div className={cx("user", className)} style={style}>
      {user && user.avatar ? (
        <img src={user.avatar} alt={t("user.avatar_alt", { name: user.name }).toString()} />
      ) : (
        <FaUser className="default" />
      )}
    </div>
  );
};
