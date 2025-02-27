import fileSaver from "file-saver";
import { FC, useMemo } from "react";
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
import { useFile, useFileActions, useGraphDatasetActions } from "../../core/context/dataContexts";
import { getFilename } from "../../core/file/utils";
import { useModal } from "../../core/modals";
import { useNotifications } from "../../core/notifications";
import { useConnectedUser } from "../../core/user";
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
  const { loading, saveFile } = useCloudProvider();
  const { exportAsGexf, exportAsGephiLite } = useFileActions();
  const {
    current: currentFile,
    status: { type: exportState },
  } = useFile();
  const { resetGraph } = useGraphDatasetActions();

  const opens = useMemo(
    () => [
      {
        id: "new",
        enabled: true,
        icon: ImFileEmpty,
        onClick: () => {
          openModal({
            component: ConfirmModal,
            arguments: {
              title: t(`graph.open.new.title`),
              message: t(`graph.open.new.message`),
              successMsg: t(`graph.open.new.success`),
            },
            beforeSubmit: () => resetGraph(),
          });
        },
      },
      {
        id: "github",
        enabled: user && user.provider,
        icon: FaRegFolderOpen,
        onClick: () => {
          openModal({ component: CloudFileModal, arguments: {} });
        },
      },
      {
        id: "local",
        enabled: true,
        icon: FaRegFolderOpen,
        onClick: () => {
          openModal({ component: LocalFileModal, arguments: {} });
        },
      },
      {
        id: "remote",
        enabled: true,
        icon: FaRegFolderOpen,
        onClick: () => {
          openModal({ component: RemoteFileModal, arguments: {} });
        },
      },
    ],
    [user, openModal, resetGraph, t],
  );

  const saves = useMemo(
    () => [
      {
        id: "save",
        enabled: currentFile?.type === "cloud" && currentFile?.format === "gephi-lite" && user,
        icon: FaRegSave,
        onClick: async () => {
          try {
            await saveFile();
            notify({
              type: "success",
              message: t("graph.save.name").toString(),
            });
          } catch (e) {
            console.error(e);
            notify({ type: "error", message: t("graph.save.github.error").toString() });
          }
        },
      },
      {
        id: "local",
        enabled: true,
        icon: FaRegSave,
        onClick: async () => {
          console.time("exportAsGephiLite");
          try {
            await exportAsGephiLite((content) => {
              fileSaver(new Blob([content]), getFilename(currentFile?.filename || "gephi-lite", "gephi-lite"));
            });
            notify({ type: "success", message: t("menu.save.local.success").toString() });
          } catch (e) {
            console.error(e);
            notify({ type: "error", message: t("menu.save.local.error").toString() });
          } finally {
            console.timeEnd("exportAsGephiLite");
          }
        },
      },
      {
        id: "github",
        enabled: user && user.provider,
        icon: FaRegSave,
        onClick: () => {
          openModal({ component: SaveCloudFileModal, arguments: {} });
        },
      },
    ],
    [openModal, user, currentFile, t, notify, exportAsGephiLite, saveFile],
  );

  const exports = useMemo(
    () => [
      {
        id: "png",
        icon: BsFiletypePng,
        onClick: () => {
          openModal({ component: ExportPNGModal, arguments: {} });
        },
      },
      {
        id: "gexf",
        icon: FaDownload,
        onClick: async () => {
          try {
            await exportAsGexf((content) => {
              fileSaver(new Blob([content]), getFilename(currentFile?.filename || "gephi-lite", "gexf"));
            });
            notify({ type: "success", message: t("graph.export.gexf.success").toString() });
          } catch (e) {
            console.error(e);
            notify({ type: "error", message: t("graph.export.gexf.error").toString() });
          }
        },
      },
    ],
    [notify, t, openModal, exportAsGexf, currentFile],
  );

  return (
    <>
      <div className="panel-block">
        <h2 className="fs-4">
          <FileIcon className="me-1" /> {t("file.title")}
        </h2>
      </div>

      <hr className="m-0" />

      <div className="panel-block-grow">
        {/* CLONE */}
        <div className="mb-3">
          <button
            className="btn btn-sm btn-outline-dark mb-3"
            onClick={async () => {
              await openInNewTab();
              notify({
                type: "success",
                message: t("graph.clone_in_new_tab.success").toString(),
              });
            }}
          >
            <FaClone className="me-1" />
            {t("graph.clone_in_new_tab.title").toString()}
          </button>
        </div>

        {/* SIGNIN */}
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

        {/* OPEN */}
        <div className="position-relative">
          <h3 className="fs-5">{t("graph.open.title")}</h3>
          {opens
            .filter((e) => e.enabled)
            .map((openDef) => (
              <div key={openDef.id}>
                <button className="btn btn-sm btn-outline-dark mb-1" onClick={openDef.onClick}>
                  <openDef.icon className="me-1" />
                  {t(`graph.open.${openDef.id}.title`)}
                </button>
              </div>
            ))}
        </div>

        {/* SAVE */}
        <div className="position-relative  mt-3">
          <h3 className="fs-5">{t("graph.save.title")}</h3>
          {saves
            .filter((e) => e.enabled)
            .map((saveDef) => (
              <div key={saveDef.id}>
                <button className="btn btn-sm btn-outline-dark mb-1" onClick={saveDef.onClick}>
                  <saveDef.icon className="me-1" />
                  {t(`graph.save.${saveDef.id}.title`)}
                </button>
              </div>
            ))}
        </div>

        {/* EXPORT */}
        <div className="position-relative mt-3">
          <h3 className="fs-5">{t("graph.export.title")}</h3>
          {exports.map((exportDef) => (
            <div key={exportDef.id}>
              <button className="btn btn-sm btn-outline-dark mb-1" onClick={exportDef.onClick}>
                <exportDef.icon className="me-1" />
                {t(`graph.export.${exportDef.id}.title`)}
              </button>
            </div>
          ))}
        </div>

        {(loading || exportState === "loading") && <Loader />}
      </div>

      {(loading || exportState === "loading") && <Loader />}
    </>
  );
};
