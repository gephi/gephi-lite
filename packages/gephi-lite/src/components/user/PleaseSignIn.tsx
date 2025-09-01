import type { FC } from "react";
import { useTranslation } from "react-i18next";

import { useModal } from "../../core/modals";
import { LoginIcon } from "../common-icons";
import { GithubLoginModal } from "../modals/GithubLoginModal";

export const PleaseSignIn: FC = () => {
  const { t } = useTranslation();
  const { openModal } = useModal();
  return (
    <div className="d-flex flex-column justify-content-center align-items-center h-100 text-center">
      <button
        onClick={() => openModal({ component: GithubLoginModal, arguments: {} })}
        className="gl-btn gl-btn-outline mb-2"
      >
        <LoginIcon /> {t("workspace.menu.github_signin")}
      </button>
      <p className="small">{t("graph.open.github.must-be-signed")}</p>
    </div>
  );
};
