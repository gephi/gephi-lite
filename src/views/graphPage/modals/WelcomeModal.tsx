import { FC, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FaRegFolderOpen } from "react-icons/fa";

import { Loader } from "../../../components/Loader";
import LocalSwitcher from "../../../components/LocalSwitcher";
import { GitHubIcon } from "../../../components/common-icons";
import { Modal } from "../../../components/modals";
import { useFileActions, useFileState, usePreferences } from "../../../core/context/dataContexts";
import { useModal } from "../../../core/modals";
import { ModalProps } from "../../../core/modals/types";
import { useNotifications } from "../../../core/notifications";
import { useConnectedUser } from "../../../core/user";
import { CloudFileModal } from "./open/CloudFileModal";
import { LocalFileModal } from "./open/LocalFileModal";
import { RemoteFileModal } from "./open/RemoteFileModal";

const SAMPLES = ["Les Miserables.gexf", "Java.gexf", "Power Grid.gexf"];

export const WelcomeModal: FC<ModalProps<unknown>> = ({ cancel, submit }) => {
  const { t } = useTranslation();
  const { openModal } = useModal();
  const { notify } = useNotifications();
  const [user] = useConnectedUser();
  const { recentRemoteFiles } = usePreferences();

  const { type: fileStateType } = useFileState();
  const { openRemoteFile } = useFileActions();

  useEffect(() => {
    if (fileStateType === "error") {
      notify({
        type: "error",
        message: t("graph.open.remote.error") as string,
        title: t("gephi-lite.title") as string,
      });
    }
  }, [fileStateType, notify, t]);

  return (
    <Modal
      title={
        <>
          <img
            src={`${import.meta.env.BASE_URL}/gephi-logo.svg`}
            style={{ width: "1em" }}
            alt={t("welcome.logo") as string}
            className="me-2"
          />{" "}
          {t("welcome.title")}
          <span className="flex-grow-1" />
          <span className="me-1" style={{ marginTop: "-0.1em" }}>
            <LocalSwitcher />
          </span>
        </>
      }
      onClose={fileStateType === "loading" ? undefined : () => cancel()}
      className="modal-lg"
    >
      <div className="row mb-3 position-relative">
        <div className="col-6">
          <h3 className="fs-6">{t("welcome.open_recent")}</h3>
          {!!recentRemoteFiles.length && (
            <ul className="list-unstyled">
              {recentRemoteFiles.map((remoteFile, i) => (
                <li className="mb-1" key={i}>
                  <button
                    className="btn btn-sm btn-outline-dark"
                    onClick={async () => {
                      await openRemoteFile(remoteFile);
                      notify({
                        type: "success",
                        message: t("graph.open.remote.success", { filename: remoteFile.filename }) as string,
                        title: t("gephi-lite.title") as string,
                      });
                      submit({});
                    }}
                  >
                    {remoteFile.filename}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {!recentRemoteFiles.length && <p className="text-muted">{t("welcome.no_recent")}</p>}
        </div>
        <div className="col-6">
          <h3 className="fs-6">{t("welcome.open_graph")}</h3>
          <ul className="list-unstyled">
            {user && user.provider && (
              <li className="mb-1">
                <button
                  className="btn btn-sm btn-outline-dark"
                  title={t(`menu.open.cloud`, { provider: t(`providers.${user.provider.type}`) }).toString()}
                  onClick={() => {
                    openModal({ component: CloudFileModal, arguments: {} });
                  }}
                >
                  <FaRegFolderOpen className="me-1" />
                  {t(`menu.open.cloud`, { provider: t(`providers.${user.provider.type}`) }).toString()}
                </button>
              </li>
            )}
            <li className="mb-1">
              <button
                className="btn btn-sm btn-outline-dark"
                title={t(`menu.open.local`).toString()}
                onClick={() => {
                  openModal({ component: LocalFileModal, arguments: {} });
                }}
              >
                <FaRegFolderOpen className="me-1" />
                {t(`menu.open.local`).toString()}
              </button>
            </li>
            <li className="mb-1">
              <button
                className="btn btn-sm btn-outline-dark"
                title={t(`menu.open.remote`).toString()}
                onClick={() => {
                  openModal({ component: RemoteFileModal, arguments: {} });
                }}
              >
                <FaRegFolderOpen className="me-1" />
                {t(`menu.open.remote`).toString()}
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
                    await openRemoteFile({
                      type: "remote",
                      url: `${import.meta.env.BASE_URL}/samples/${sample}`,
                      filename: sample,
                    });
                    notify({
                      type: "success",
                      message: t("graph.open.remote.success", { filename: sample }) as string,
                      title: t("gephi-lite.title") as string,
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
          <div>{t("welcome.disclaimer-1")}</div>
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
