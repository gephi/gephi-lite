import { FC, CSSProperties } from "react";
import cx from "classnames";
import { BsPerson } from "react-icons/bs";

import { useConnectedUser } from "../../core/user";

export const UserAvatar: FC<{ className?: string; style?: CSSProperties }> = ({ className, style }) => {
  const [user] = useConnectedUser();

  return (
    <>
      {user && (
        <div className={cx("user", className)} style={style}>
          {user.avatar ? <img src={user.avatar} alt={`${user.name}'s avatar'`} /> : <BsPerson />}
          <span className="invisible">{user.name}</span>
        </div>
      )}
    </>
  );
};
