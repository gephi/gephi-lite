import { FC, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FaRegFolderOpen } from "react-icons/fa";
import { ImFileEmpty } from "react-icons/im";

import { version } from "../../../package.json";
import GephiLogo from "../../assets/gephi-logo.svg?react";
import { useFile, useFileActions, useGraphDatasetActions } from "../../core/context/dataContexts";
import { useModal } from "../../core/modals";
import { ModalProps } from "../../core/modals/types";
import { useNotifications } from "../../core/notifications";
import { useConnectedUser } from "../../core/user";
import { Loader } from "../Loader";
import LocalSwitcher from "../LocalSwitcher";
import { ThemeSwicther } from "../ThemeSwitcher";
import { GitHubIcon } from "../common-icons";
import { Modal } from "../modals";
import ConfirmModal from "./ConfirmModal";
import { OpenCloudFileModal } from "./open/CloudFileModal";
import { OpenLocalFileModal } from "./open/LocalFileModal";
import { OpenRemoteFileModal } from "./open/RemoteFileModal";

const SAMPLES = ["Les Miserables.gexf", "Java.gexf", "Power Grid.gexf"];

export const WelcomeModal: FC<ModalProps<unknown>> = ({ cancel, submit }) => {
  const { t } = useTranslation();
  const { openModal } = useModal();
  const { notify } = useNotifications();
  const [user] = useConnectedUser();
  const {
    recentFiles,
    status: { type: fileStateType },
  } = useFile();
  const { open } = useFileActions();
  const { resetGraph } = useGraphDatasetActions();

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
    <Modal
      title={
        <>
          <GephiLogo className="me-1" style={{ height: "1em", width: "1em" }} />
          {t("welcome.title")}
          <span className="flex-grow-1" />
          <span className="me-1" style={{ marginTop: "-0.1em" }}>
            <ThemeSwicther />
          </span>
          <span className="me-1" style={{ marginTop: "-0.1em" }}>
            <LocalSwitcher />
          </span>
        </>
      }
      onClose={fileStateType === "loading" ? undefined : () => cancel()}
      className="modal-lg"
    >
      <div className="row mb-3 position-relative">
        <div className="col-12 col-sm-6">
          <h3 className="fs-6">{t("welcome.open_recent")}</h3>
          {!!recentFiles.length && (
            <ul className="list-unstyled">
              {recentFiles
                .filter((f) => f.type === "remote")
                .map((file, i) => (
                  <li className="mb-1" key={i}>
                    <button
                      className="btn btn-sm btn-outline-dark"
                      onClick={async () => {
                        await open(file);
                        notify({
                          type: "success",
                          message: t("graph.open.remote.success", { filename: file.filename }),
                          title: t("gephi-lite.title"),
                        });
                        submit({});
                      }}
                    >
                      {file.filename}
                    </button>
                  </li>
                ))}
            </ul>
          )}
          {!recentFiles.length && <p className="text-muted">{t("welcome.no_recent")}</p>}
        </div>
        <div className="col-12 col-sm-6">
          <h3 className="fs-6">{t("welcome.open_graph")}</h3>
          <ul className="list-unstyled">
            {user && user.provider && (
              <li className="mb-1">
                <button
                  className="btn btn-sm btn-outline-dark"
                  title={t(`graph.open.github.title`).toString()}
                  onClick={() => {
                    openModal({ component: OpenCloudFileModal, arguments: {} });
                  }}
                >
                  <FaRegFolderOpen className="me-1" />
                  {t(`graph.open.github.title`).toString()}
                </button>
              </li>
            )}
            <li className="mb-1">
              <button
                className="btn btn-sm btn-outline-dark"
                title={t(`graph.open.local.title`).toString()}
                onClick={() => {
                  openModal({ component: OpenLocalFileModal, arguments: {} });
                }}
              >
                <FaRegFolderOpen className="me-1" />
                {t(`graph.open.local.title`).toString()}
              </button>
            </li>
            <li className="mb-1">
              <button
                className="btn btn-sm btn-outline-dark"
                title={t(`graph.open.remote.title`).toString()}
                onClick={() => {
                  openModal({ component: OpenRemoteFileModal, arguments: {} });
                }}
              >
                <FaRegFolderOpen className="me-1" />
                {t(`graph.open.remote.title`).toString()}
              </button>
            </li>
            <li className="mb-1">
              <button
                className="btn btn-sm btn-outline-dark"
                title={t(`graph.open.new.title`).toString()}
                onClick={() => {
                  openModal({
                    component: ConfirmModal,
                    arguments: {
                      title: t(`graph.open.new.title`),
                      message: t(`graph.open.new.message`),
                      successMsg: t(`graph.open.new.success`),
                    },
                    beforeSubmit: () => resetGraph(),
                  });
                }}
              >
                <ImFileEmpty className="me-1" />
                {t(`graph.open.new.title`).toString()}
              </button>
            </li>
          </ul>
          <br />
          <h3 className="fs-6">{t("welcome.samples")}</h3>
          <ul className="list-unstyled">
            {SAMPLES.map((sample) => (
              <li className="mb-1" key={sample}>
                <button
                  className="btn btn-sm btn-outline-dark"
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
      <div className="d-flex align-items-center w-100">
        <div className="text-muted small flex-grow-1 flex-shrink-1">
          <div>
            {t("welcome.disclaimer-1")}{" "}
            <a rel="noreferrer" target="_blank" href="https://github.com/gephi/gephi-lite/blob/main/CHANGELOG.md">
              v{version}
            </a>
          </div>
          <div>{t("welcome.disclaimer-2")}</div>
        </div>
        <a
          href="https://github.com/gephi/gephi-lite"
          target="_blank"
          rel="noreferrer"
          className="flex-shrink-0 btn btn-ico"
        >
          <GitHubIcon />
        </a>
      </div>
    </Modal>
  );
};
