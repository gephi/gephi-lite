import { FC, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { version } from "../../../package.json";
import GephiLiteReversedLogo from "../../assets/gephi-lite-logo-reversed.svg?react";
import GephiLiteLogo from "../../assets/gephi-lite-logo.svg?react";
import { useFile, useFileActions, usePreferences } from "../../core/context/dataContexts";
import { useModal } from "../../core/modals";
import { ModalProps } from "../../core/modals/types";
import { useNotifications } from "../../core/notifications";
import { getAppliedTheme } from "../../core/preferences/utils";
import { Loader } from "../Loader";
import { GitHubIcon } from "../common-icons";
import { Modal } from "../modals";
import { OpenModal } from "./open/OpenModal";

const SAMPLES = ["Les Miserables.gexf", "Java.gexf", "Power Grid.gexf"];

export const WelcomeModal: FC<ModalProps<unknown>> = ({ cancel, submit }) => {
  const { t } = useTranslation();
  const { openModal } = useModal();
  const { notify } = useNotifications();
  const { theme } = usePreferences();
  const {
    status: { type: fileStateType },
  } = useFile();
  const { open } = useFileActions();

  useEffect(() => {
    if (fileStateType === "error") {
      notify({
        type: "error",
        message: t("graph.open.remote.error"),
        title: t("gephi-lite.title"),
      });
    }
  }, [fileStateType, notify, t]);

  return (
    <Modal showHeader={false} onClose={fileStateType === "loading" ? undefined : () => cancel()} className="modal-lg">
      <div className="row position-relative align-items-center mb-5 mt-4">
        <div className="col-12 col-sm-6 d-flex flex-column align-items-center gl-gap-1 mb-5 mb-sm-0 py-4">
          {getAppliedTheme(theme) === "light" ? (
            <GephiLiteLogo className="mb-3 gl-px-2 w-33" />
          ) : (
            <GephiLiteReversedLogo className="mb-3 gl-px-2 w-33" />
          )}
          <h2 className="gl-px-2 gl-heading-2 text-center mb-0">{t("welcome.title")}</h2>
          <div>
            v{version} -{" "}
            <a rel="noreferrer" target="_blank" href="https://github.com/gephi/gephi-lite/blob/main/CHANGELOG.md">
              changelog
            </a>
          </div>
          <div className="d-flex flex-wrap align-items-center gl-gap-2 justify-content-center mt-3">
            <a rel="noreferrer" target="_blank" className="gl-btn gl-btn-outline" href="https://gephi.org/lite">
              {t("welcome.website")}
            </a>
            <a rel="noreferrer" target="_blank" className="gl-btn gl-btn-outline" href="https://docs.gephi.org/lite">
              {t("welcome.documentation")}
            </a>
            <a
              rel="noreferrer"
              target="_blank"
              className="gl-btn gl-btn-icon gl-btn-outline"
              href="https://github.com/gephi/gephi-lite"
            >
              <GitHubIcon />
            </a>
          </div>
        </div>
        <div className="col-12 col-sm-6 px-5">
          <h3 className="gl-px-2 gl-heading-3">{t("welcome.open_graph")}</h3>
          <ul className="list-unstyled mb-0 d-flex flex-column">
            <li className="mb-1">
              <button
                className="gl-btn text-start"
                title={t(`graph.open.local.title`).toString()}
                onClick={() => {
                  openModal({ component: OpenModal, arguments: { initialOpenedTab: "local" } });
                }}
              >
                {t(`graph.open.local.title`).toString()}
              </button>
            </li>
            <li className="mb-1">
              <button
                className="gl-btn text-start"
                title={t(`graph.open.github.title`).toString()}
                onClick={() => {
                  openModal({ component: OpenModal, arguments: { initialOpenedTab: "github" } });
                }}
              >
                {t(`graph.open.github.title`).toString()}
              </button>
            </li>
          </ul>
          <br />
          <h3 className="gl-px-2 gl-heading-3">{t("welcome.samples")}</h3>
          <ul className="list-unstyled mb-0 d-flex flex-column">
            {SAMPLES.map((sample) => (
              <li key={sample}>
                <button
                  className="gl-btn text-start"
                  onClick={async () => {
                    await open({
                      type: "remote",
                      url: `${import.meta.env.BASE_URL}samples/${sample}`,
                      filename: sample,
                    });
                    notify({
                      type: "success",
                      message: t("graph.open.remote.success", { filename: sample }),
                      title: t("gephi-lite.title"),
                    });
                    submit({});
                  }}
                >
                  {sample}
                </button>
              </li>
            ))}
          </ul>
        </div>
        {fileStateType === "loading" && <Loader />}
      </div>
    </Modal>
  );
};
