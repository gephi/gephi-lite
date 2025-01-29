import fileSaver from "file-saver";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import { BsFiletypePng } from "react-icons/bs";
import { FaDownload, FaRegFolderOpen, FaRegSave } from "react-icons/fa";
import { FaClone } from "react-icons/fa6";
import { ImFileEmpty } from "react-icons/im";

import { Loader } from "../../components/Loader";
import { FileIcon, SingInIcon } from "../../components/common-icons";
import { SignInModal } from "../../components/user/SignInModal";
import { openInNewTab } from "../../core/broadcast/utils";
import { useCloudProvider } from "../../core/cloud/useCloudProvider";
import { useExportActions, useExportState, useGraphDatasetActions, useOrigin } from "../../core/context/dataContexts";
import { useModal } from "../../core/modals";
import { useNotifications } from "../../core/notifications";
import { useConnectedUser } from "../../core/user";
import { checkFilenameExtension } from "../../utils/check";
import ConfirmModal from "./modals/ConfirmModal";
import { CloudFileModal } from "./modals/open/CloudFileModal";
import { LocalFileModal } from "./modals/open/LocalFileModal";
import { RemoteFileModal } from "./modals/open/RemoteFileModal";
import { ExportPNGModal } from "./modals/save/ExportPNGModal";
import { SaveCloudFileModal } from "./modals/save/SaveCloudFileModal";

export const FilePanel: FC = () => {
  const { openModal } = useModal();
  const [user] = useConnectedUser();
  const { notify } = useNotifications();
  const { t } = useTranslation("translation");
  const origin = useOrigin();
  const { loading, saveFile } = useCloudProvider();
  const { exportAsGexf } = useExportActions();
  const { type: exportState } = useExportState();
  const { resetGraph } = useGraphDatasetActions();

  return (
    <>
      <div className="panel-block">
        <h2 className="fs-4">
          <FileIcon className="me-1" /> {t("file.title")}
        </h2>
      </div>

      <hr className="m-0" />

      <div className="panel-block-grow">
        {!user?.provider && (
          <>
            <p className="small">{t("file.login_capabilities")}</p>
            <div className="mb-3">
              <button
                className="btn btn-sm btn-outline-dark mb-1"
                onClick={() => openModal({ component: SignInModal, arguments: {} })}
              >
                <SingInIcon className="me-1" />
                {t("auth.sign_in")}
              </button>
            </div>
          </>
        )}

        <div className="position-relative">
          {/* Save links */}
          <h3 className="fs-5">{t("graph.save.title")}</h3>
          {user && user.provider && (
            <>
              {origin && origin.type === "cloud" && checkFilenameExtension(origin.filename, "gexf") && (
                <div>
                  <button
                    className="btn btn-sm btn-outline-dark mb-1"
                    onClick={async () => {
                      try {
                        await saveFile();
                        notify({
                          type: "success",
                          message: t("graph.save.cloud.success", { filename: origin.filename }).toString(),
                        });
                      } catch (e) {
                        console.error(e);
                        notify({ type: "error", message: t("graph.save.cloud.error").toString() });
                      }
                    }}
                  >
                    <FaRegSave className="me-1" />
                    {t("menu.save.default").toString()}
                  </button>
                </div>
              )}
              <div>
                <button
                  className="btn btn-sm btn-outline-dark mb-1"
                  onClick={() => {
                    openModal({ component: SaveCloudFileModal, arguments: {} });
                  }}
                >
                  <FaRegSave className="me-1" />
                  {t("menu.save.cloud", { provider: t(`providers.${user.provider.type}`) }).toString()}
                </button>
              </div>
              <div>
                <hr className="dropdown-divider" />
              </div>
            </>
          )}
          <div>
            <button
              className="btn btn-sm btn-outline-dark mb-1"
              onClick={async () => {
                try {
                  await exportAsGexf((content) => {
                    fileSaver(new Blob([content]), origin?.filename || "gephi-lite.gexf");
                  });
                } catch (e) {
                  console.error(e);
                  notify({ type: "error", message: t("menu.download.gexf-error").toString() });
                }
              }}
            >
              <FaDownload className="me-1" />
              {t("menu.download.gexf").toString()}
            </button>
          </div>

          {/* Open links */}
          <h3 className="fs-5 mt-3">{t("graph.open.title")}</h3>
          {user && user.provider && (
            <div>
              <button
                className="btn btn-sm btn-outline-dark mb-1"
                onClick={() => {
                  openModal({ component: CloudFileModal, arguments: {} });
                }}
              >
                <FaRegFolderOpen className="me-1" />
                {t(`menu.open.cloud`, { provider: t(`providers.${user.provider.type}`) }).toString()}
              </button>
            </div>
          )}
          <div>
            <button
              className="btn btn-sm btn-outline-dark mb-1"
              onClick={() => {
                openModal({ component: LocalFileModal, arguments: {} });
              }}
            >
              <FaRegFolderOpen className="me-1" />
              {t(`menu.open.local`).toString()}
            </button>
          </div>
          <div>
            <button
              className="btn btn-sm btn-outline-dark mb-1"
              onClick={() => {
                openModal({ component: RemoteFileModal, arguments: {} });
              }}
            >
              <FaRegFolderOpen className="me-1" />
              {t(`menu.open.remote`).toString()}
            </button>
          </div>

          <div>
            <button
              className="btn btn-sm btn-outline-dark mb-1"
              title={t(`menu.open.new`).toString()}
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
              {t("menu.open.new").toString()}
            </button>
          </div>

          {/* Export links */}
          <h3 className="fs-5 mt-3">{t("graph.export.title")}</h3>
          <div>
            <button
              className="btn btn-sm btn-outline-dark mb-1"
              onClick={() => {
                openModal({ component: ExportPNGModal, arguments: {} });
              }}
            >
              <BsFiletypePng className="me-1" />
              {t("graph.export.png.title").toString()}
            </button>
          </div>
          <div>
            <button
              className="btn btn-sm btn-outline-dark mb-1"
              onClick={async () => {
                await openInNewTab();
                notify({
                  type: "success",
                  message: t("graph.export.clone_in_new_tab.success").toString(),
                });
              }}
            >
              <FaClone className="me-1" />
              {t("graph.export.clone_in_new_tab.title").toString()}
            </button>
          </div>

          {(loading || exportState === "loading") && <Loader />}
        </div>
      </div>
    </>
  );
};
