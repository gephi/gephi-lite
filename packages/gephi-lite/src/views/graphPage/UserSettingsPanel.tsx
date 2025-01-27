import { FC } from "react";
import { useTranslation } from "react-i18next";

import LocalSwitcher from "../../components/LocalSwitcher";
import { ThemeSwicther } from "../../components/ThemeSwitcher";
import { DangerIcon, GitHubIcon, SettingsIcon, SignOutIcon, SingInIcon } from "../../components/common-icons";
import { SignInModal } from "../../components/user/SignInModal";
import { resetStates } from "../../core/context/dataContexts";
import { useModal } from "../../core/modals";
import { useNotifications } from "../../core/notifications";
import { useConnectedUser } from "../../core/user";
import ConfirmModal from "./modals/ConfirmModal";

export const UserSettingsPanel: FC = () => {
  const { openModal } = useModal();
  const { notify } = useNotifications();
  const [user, setUser] = useConnectedUser();
  const { t } = useTranslation("translation");

  return (
    <>
      <div className="panel-block">
        <h2 className="fs-4">
          <SettingsIcon className="me-1" /> {t("settings.title")}
        </h2>
      </div>

      <hr className="m-0" />

      <div className="panel-block-grow">
        <div className="d-flex flex-row mb-3 align-items-center">
          <span className="flex-grow-1">{t("github.select_ui_language")}</span>
          <LocalSwitcher />
        </div>
        <hr className="m-0" />
        <div className="d-flex flex-row my-3 align-items-center">
          <span className="flex-grow-1">{t("settings.theme")}</span>
          <ThemeSwicther />
        </div>
        <hr className="m-0" />
        <h3 className="fs-5 mt-3">
          <GitHubIcon /> {t("github.title")}
        </h3>
        {!user && (
          <>
            <p className="small">{t("github.description")}</p>
            <div className="text-center">
              <button
                className="btn btn-sm btn-outline-dark"
                title={t("auth.sign_in").toString()}
                onClick={() => openModal({ component: SignInModal, arguments: {} })}
              >
                <SingInIcon className="me-1" />
                {t("auth.sign_in")}
              </button>
            </div>
          </>
        )}
        {user && (
          <>
            <p className="small m-0">{t("github.logged_as", { username: user.name })}</p>
            <div className="text-center">
              <button
                className="btn btn-sm btn-outline-dark"
                title={t("auth.sign_out").toString()}
                onClick={() => {
                  setUser(null);
                  notify({
                    type: "success",
                    message: t("auth.unauth_success").toString(),
                  });
                }}
              >
                <SignOutIcon className="me-1" /> {t("auth.sign_out")}
              </button>
            </div>
          </>
        )}
      </div>
      <div className="d-flex justify-content-center">
        <button
          className="btn btn-danger m-3"
          onClick={() => {
            openModal({
              component: ConfirmModal,
              arguments: {
                title: t("settings.danger-zone.reset-state.title"),
                message: t("settings.danger-zone.reset-state.description"),
                successMsg: t("settings.danger-zone.reset-state.success"),
              },
              beforeSubmit: () => {
                resetStates(true);
              },
            });
          }}
        >
          <DangerIcon />
          &nbsp;
          {t("settings.danger-zone.reset-state.title")}
        </button>
      </div>
    </>
  );
};
