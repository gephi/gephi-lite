import type { FC } from "react";
import { useTranslation } from "react-i18next";

import { useModal } from "../../core/modals";
import { GithubLoginModal } from "../modals/GithubLoginModal";

export const PleaseSignIn: FC = () => {
  const { t } = useTranslation();
  const { openModal } = useModal();
  return (
    <div className="text-center">
      <p>{t("graph.open.github.must-be-signed")}</p>
      <button onClick={() => openModal({ component: GithubLoginModal, arguments: {} })} className="gl-btn gl-btn-fill">
        {t("workspace.menu.github_signin")}
      </button>
    </div>
  );
};
