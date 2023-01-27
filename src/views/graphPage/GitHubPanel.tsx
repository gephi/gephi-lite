import { FC } from "react";
import { useTranslation } from "react-i18next";

import { GitHubIcon } from "../../components/common-icons";
import { MdLogin, MdLogout } from "react-icons/md";
import { useConnectedUser } from "../../core/user";
import { useNotifications } from "../../core/notifications";
import { SignInModal } from "../../components/user/SignInModal";
import { useModal } from "../../core/modals";

export const GitHubPanel: FC = () => {
  const { openModal } = useModal();
  const { notify } = useNotifications();
  const [user, setUser] = useConnectedUser();
  const { t } = useTranslation("translation");

  return (
    <div>
      <h2 className="fs-4">
        <GitHubIcon className="me-1" /> {t("github.title")}
      </h2>

      <br />

      {!user && (
        <>
          <p className="small">{t("github.description")}</p>
          <button
            className="btn btn-sm btn-outline-dark"
            title={t("auth.sign_in").toString()}
            onClick={() => openModal({ component: SignInModal, arguments: {} })}
          >
            <MdLogin className="me-1" />
            {t("auth.sign_in")}
          </button>
        </>
      )}
      {user && (
        <>
          <p className="small">{t("github.logged_as", { username: user.name })}</p>
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
            <MdLogout className="me-1" /> {t("auth.sign_out")}
          </button>
        </>
      )}
    </div>
  );
};
