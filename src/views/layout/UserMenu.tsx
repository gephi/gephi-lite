import { FC } from "react";
import { BsFolder } from "react-icons/bs";
import { MdLogin, MdLogout } from "react-icons/md";
import { isNil } from "lodash";

import { useModal } from "../../core/modals";
import { useConnectedUser } from "../../core/user";
import { SignInModal } from "../../components/user/SignInModal";
import { UserAvatar } from "../../components/user/UserAvatar";
import { OpenFileModal } from "../../components/cloud/OpenFileModal";
import { useNotifications } from "../../core/notifications";

export const UserMenu: FC = () => {
  const { openModal } = useModal();
  const [user, setUser] = useConnectedUser();
  const { notify } = useNotifications();

  return (
    <nav className="d-inline-flex mt-2 mt-md-0 ms-md-auto">
      <ul className="nav nav-pills">
        {user && (
          <li className="nav-item dropdown">
            <button className="nav-link dropdown-toggle">
              <UserAvatar className="user-sm" />
            </button>
            <ul className="dropdown-menu end-0">
              <li>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    openModal({ component: OpenFileModal, arguments: {} });
                  }}
                >
                  <BsFolder className="me-1" /> Open a graph
                </button>
              </li>
              <li>
                <hr className="dropdown-divider" />
              </li>
              <li>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setUser(null);
                    notify({
                      message: "Unauthentication successfull",
                      type: "success",
                    });
                  }}
                >
                  <MdLogout className="me-1" /> Sign-out
                </button>
              </li>
            </ul>
          </li>
        )}
        {isNil(user) && (
          <li className="nav-item">
            <button
              className="nav-link"
              type="button"
              onClick={() => openModal({ component: SignInModal, arguments: {} })}
            >
              <MdLogin className="me-1" /> Sign-in
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
};
