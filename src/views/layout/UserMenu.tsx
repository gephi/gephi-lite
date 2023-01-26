import { FC } from "react";
import { MdLogin, MdLogout } from "react-icons/md";
import { FaRegSave, FaRegFolderOpen, FaDownload } from "react-icons/fa";
import { isNil } from "lodash";
import { useTranslation } from "react-i18next";

import { useModal } from "../../core/modals";
import { useConnectedUser } from "../../core/user";
import { useNotifications } from "../../core/notifications";
import { useGraphDataset } from "../../core/context/dataContexts";
import { useCloudProvider } from "../../core/cloud/useCloudProvider";
import { useExportAsGexf } from "../../core/graph/useExportAsGexf";
import { SignInModal } from "../../components/user/SignInModal";
import { UserAvatar } from "../../components/user/UserAvatar";
import { Loader } from "../../components/Loader";
import { LocalFileModal } from "../graphPage/modals/open/LocalFileModal";
import { RemoteFileModal } from "../graphPage/modals/open/RemoteFileModal";
import { CloudFileModal } from "../graphPage/modals/open/CloudFileModal";
import { SaveCloudFileModal } from "../graphPage/modals/save/SaveCloudFileModal";

export const UserMenu: FC = () => {
  const { openModal } = useModal();
  const [user, setUser] = useConnectedUser();
  const { notify } = useNotifications();
  const { t } = useTranslation("translation");
  const { origin } = useGraphDataset();
  const { loading, saveFile } = useCloudProvider();
  const { loading: ldExportGexf, downloadAsGexf } = useExportAsGexf();

  return (
    <>
      <ul className="nav nav-pills">
        <li className="nav-item dropdown">
          <button className="nav-link dropdown-toggle p-0" title="Open menu">
            <UserAvatar className="user-sm" />
          </button>
          <ul className="dropdown-menu">
            {/* Save links */}
            {user && user.provider && (
              <>
                {origin && origin.type === "cloud" && (
                  <li>
                    <button
                      title={t("menu.save").toString()}
                      className="dropdown-item"
                      onClick={async () => {
                        try {
                          await saveFile();
                          notify({
                            type: "success",
                            message: t("graph.save.cloud.success", { filename: origin.filename }).toString(),
                          });
                        } catch (e) {
                          notify({ type: "error", message: t("graph.save.cloud.error").toString() });
                        }
                      }}
                    >
                      <FaRegSave className="me-1" />
                      {t("menu.save.default").toString()}
                    </button>
                  </li>
                )}
                <li>
                  <button
                    title={t("menu.save.cloud", { provider: user.provider.type }).toString()}
                    className="dropdown-item"
                    onClick={() => {
                      openModal({ component: SaveCloudFileModal, arguments: {} });
                    }}
                  >
                    <FaRegSave className="me-1" />
                    {t("menu.save.cloud", { provider: user.provider.type }).toString()}
                  </button>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
              </>
            )}

            {/* Download links */}
            {origin !== null && (
              <>
                <li>
                  <button
                    title={t("menu.download.gexf").toString()}
                    className="dropdown-item"
                    onClick={async () => {
                      try {
                        await downloadAsGexf();
                      } catch (e) {
                        console.error(e);
                        notify({ type: "error", message: t("menu.download.gexf-error").toString() });
                      }
                    }}
                  >
                    <FaDownload className="me-1" />
                    {t("menu.download.gexf").toString()}
                  </button>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
              </>
            )}

            {/* Open links */}
            {user && user.provider && (
              <li>
                <button
                  className="dropdown-item"
                  title={t(`menu.open.cloud`, { provider: user.provider.type }).toString()}
                  onClick={() => {
                    openModal({ component: CloudFileModal, arguments: {} });
                  }}
                >
                  <FaRegFolderOpen className="me-1" />{" "}
                  {t(`menu.open.cloud`, { provider: user.provider.type }).toString()}
                </button>
              </li>
            )}
            <li>
              <button
                className="dropdown-item"
                title={t(`menu.open.local`).toString()}
                onClick={() => {
                  openModal({ component: LocalFileModal, arguments: {} });
                }}
              >
                <FaRegFolderOpen className="me-1" />
                {t(`menu.open.local`).toString()}
              </button>
            </li>
            <li>
              <button
                className="dropdown-item"
                title={t(`menu.open.remote`).toString()}
                onClick={() => {
                  openModal({ component: RemoteFileModal, arguments: {} });
                }}
              >
                <FaRegFolderOpen className="me-1" />
                {t(`menu.open.remote`).toString()}
              </button>
            </li>

            <li>
              <hr className="dropdown-divider" />
            </li>

            {/* Auth links */}
            {user && (
              <li>
                <button
                  className="dropdown-item"
                  title={t("auth.sign_out").toString()}
                  onClick={() => {
                    setUser(null);
                    notify({
                      type: "success",
                      message: t("auth.unauth_success").toString(),
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
                  title={t("auth.sign_in").toString()}
                  onClick={() => openModal({ component: SignInModal, arguments: {} })}
                >
                  <MdLogin className="me-1" />
                  {t("auth.sign_in")}
                </button>
              </li>
            )}
          </ul>
        </li>
      </ul>
      {(loading || ldExportGexf) && <Loader />}
    </>
  );
};
