import { FC } from "react";
import { Modal } from "../../../components/modals";
import { ModalProps } from "../../../core/modals/types";
import { useTranslation } from "react-i18next";
import { CloudFileModal } from "./open/CloudFileModal";
import { FaRegFolderOpen } from "react-icons/fa";
import { LocalFileModal } from "./open/LocalFileModal";
import { RemoteFileModal } from "./open/RemoteFileModal";
import { useConnectedUser } from "../../../core/user";
import { useModal } from "../../../core/modals";
import { Loader } from "../../../components/Loader";
import { useOpenGexf } from "../../../core/graph/useOpenGexf";
import { useNotifications } from "../../../core/notifications";
import { usePreferences } from "../../../core/context/dataContexts";

const SAMPLES = ["Les Miserables.gexf", "Java.gexf", "Power Grid.gexf"];

export const WelcomeModal: FC<ModalProps<{}>> = ({ cancel, submit }) => {
  const { t } = useTranslation();
  const { openModal } = useModal();
  const { notify } = useNotifications();
  const [user] = useConnectedUser();
  const { recentRemoteFiles } = usePreferences();

  const { loading, error, openRemoteFile } = useOpenGexf();

  return (
    <Modal
      title={
        <>
          <img
            src={`${process.env.PUBLIC_URL}/gephi-logo.svg`}
            style={{ width: "1em" }}
            alt={t("welcome.logo") as string}
            className="me-2"
          />{" "}
          {t("welcome.title")}
        </>
      }
      onClose={loading ? undefined : () => cancel()}
      className="modal-lg"
    >
      <div className="row mb-3 position-relative">
        <div className="col-6">
          <h3 className="fs-6">{t("welcome.open_recent")}</h3>
          {!!recentRemoteFiles.length && (
            <ul className="list-unstyled">
              {recentRemoteFiles.map((remoteFile) => (
                <li className="mb-1" key={remoteFile.filename}>
                  <button
                    className="btn btn-sm btn-outline-dark"
                    onClick={async () => {
                      await openRemoteFile(remoteFile);
                      notify({
                        type: "success",
                        message: t("graph.open.remote.success", remoteFile) as string,
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
                      url: `${process.env.PUBLIC_URL}/samples/${sample}`,
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
        {error && <p className="text-center text-danger">{t("graph.open.remote.error").toString()}</p>}
        {loading && <Loader />}
      </div>
    </Modal>
  );
};
