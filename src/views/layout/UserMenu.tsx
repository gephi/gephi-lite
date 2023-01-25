import { FC } from "react";
import { MdLogin, MdLogout } from "react-icons/md";
import { FaRegSave, FaRegFolderOpen } from "react-icons/fa";
import { isNil } from "lodash";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation("translation");

  return (
    <nav className="d-inline-flex mt-2 mt-md-0 ms-md-auto">
      <ul className="nav nav-pills">
        <li className="nav-item dropdown">
          <button className="nav-link dropdown-toggle p-0" title="Open menu">
            <UserAvatar className="user-sm" />
          </button>
          <ul className="dropdown-menu end-0">
            {user && (
              <>
                <li>
                  <button
                    className="dropdown-item"
                    title="Save in cloud"
                    onClick={() => {
                      openModal({ component: SaveCloudFileModal, arguments: {} });
                    }}
                  >
                    <FaRegSave className="me-1" /> {t("menu.save_gist")}
                  </button>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
              </>
            )}
            {user && (
              <li>
                <button
                  className="dropdown-item"
                  title="Open a file"
                  onClick={() => {
                    openModal({ component: CloudFileModal, arguments: {} });
                  }}
                >
                  <FaRegFolderOpen className="me-1" /> {t("menu.open_file")}
                </button>
              </li>
            )}
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
            {user && (
              <li>
                <button
                  className="dropdown-item"
                  title="Sign-out"
                  onClick={() => {
                    setUser(null);
                    notify({
                      message: t("auth.unauth_success").toString(),
                      type: "success",
                    });
                  }}
                >
                  <MdLogout className="me-1" /> {t("auth.sign_out")}
                </button>
              </li>
            )}
            {isNil(user) && (
              <li className="nav-item">
                <button
                  className="dropdown-item"
                  type="button"
                  title="Sign-in"
                  onClick={() => openModal({ component: SignInModal, arguments: {} })}
                >
                  <MdLogin className="me-1" /> {t("auth.sign_in")}
                </button>
              </li>
            )}
          </ul>
        </li>
      </ul>
    </nav>
  );
};
