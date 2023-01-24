import { FC } from "react";
import { MdLogin, MdLogout } from "react-icons/md";
import { FaRegSave, FaRegFolderOpen } from "react-icons/fa";
import { isNil } from "lodash";

import { useModal } from "../../core/modals";
import { useConnectedUser } from "../../core/user";
import { SignInModal } from "../../components/user/SignInModal";
import { UserAvatar } from "../../components/user/UserAvatar";
import { CloudFileModal } from "../../components/import/CloudFileModal";
import { SaveCloudFileModal } from "../../components/export/SaveCloudFileModal";
import { LocalFileModal } from "../../components/import/LocalFileModal";
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
            <button className="nav-link dropdown-toggle p-0" title="Open menu">
              <UserAvatar className="user-sm" />
            </button>
            <ul className="dropdown-menu end-0">
              <li>
                <button
                  className="dropdown-item"
                  title="Save in cloud"
                  onClick={() => {
                    openModal({ component: SaveCloudFileModal, arguments: {} });
                  }}
                >
                  <FaRegSave className="me-1" /> Save as a gist
                </button>
              </li>
              <li>
                <hr className="dropdown-divider" />
              </li>
              <li>
                <button
                  className="dropdown-item"
                  title="Open a file"
                  onClick={() => {
                    openModal({ component: CloudFileModal, arguments: {} });
                  }}
                >
                  <FaRegFolderOpen className="me-1" /> Open a file
                </button>
              </li>
              <li>
                <button
                  className="dropdown-item"
                  title="Open a local file"
                  onClick={() => {
                    openModal({ component: LocalFileModal, arguments: {} });
                  }}
                >
                  <FaRegFolderOpen className="me-1" /> Open local file
                </button>
              </li>
              <li>
                <hr className="dropdown-divider" />
              </li>
              <li>
                <button
                  className="dropdown-item"
                  title="Sign-out"
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
              title="Sign-in"
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
