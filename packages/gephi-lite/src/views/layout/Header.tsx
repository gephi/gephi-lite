import cx from "classnames";
// import FileSaver from "file-saver";
import { type FC, PropsWithChildren, useMemo, useState } from "react";
import AnimateHeight from "react-animate-height";
import { useTranslation } from "react-i18next";
import { PiList, PiX } from "react-icons/pi";
import { Link, useLocation } from "react-router";

import Dropdown, { type Option } from "../../components/Dropdown";
import {
  DataIcon,
  DataIconFill,
  ExternalLinkIcon,
  GraphIcon,
  GraphIconFill,
} from "../../components/common-icons";
import ConfirmModal from "../../components/modals/ConfirmModal";
// import { GithubLoginModal } from "../../components/modals/GithubLoginModal";


import { openInNewTab } from "../../core/broadcast/utils";
import { useCloudProvider } from "../../core/cloud/useCloudProvider";
import {
  useAppearance,
  useDataTable,
  useFile,
  useGraphDatasetActions,
  useSigmaAtom,
} from "../../core/context/dataContexts";
// import { getFilename } from "../../core/file/utils";
import { useModal } from "../../core/modals";
import { useNotifications } from "../../core/notifications";
import { useConnectedUser } from "../../core/user";
import { getGraphSnapshot } from "../../utils/sigma";

export const Header: FC<PropsWithChildren> = ({ children }) => {
  const location = useLocation();
  const { t } = useTranslation();
  const [user] = useConnectedUser();
  const { openModal } = useModal();
  const { notify } = useNotifications();
  const { type: dataTableItemType } = useDataTable();
  const { resetGraph } = useGraphDatasetActions();
  const { saveFile } = useCloudProvider();
  // const { exportAsGexf } = useFileActions();
  const { current: currentFile } = useFile();
  const sigma = useSigmaAtom();
  const { backgroundColor } = useAppearance();

  // For mobile burger menu:
  const [expanded, setExpanded] = useState(false);

  const workspaceMenuList = useMemo(
    () =>
      [
        {
          label: t("workspace.menu.new"),
          onClick: () =>
            openModal({
              component: ConfirmModal,
              arguments: {
                title: t(`graph.open.new.title`),
                message: t(`graph.open.new.message`),
                successMsg: t(`graph.open.new.success`),
              },
              beforeSubmit: () => resetGraph(),
            }),
        },
        {
          label: (
            <span className="d-flex">
              <span className="flex-grow-1">{t("workspace.menu.duplicate")}</span> <ExternalLinkIcon />
            </span>
          ),
          onClick: async () => {
            await openInNewTab();
            notify({
              type: "success",
              message: t("graph.clone_in_new_tab.success").toString(),
            });
          },
        },

        ...(currentFile?.type === "cloud" && currentFile?.format === "gephi-lite" && user
          ? [
            {
              label: t("workspace.menu.save"),
              onClick: async () => {
                try {
                  const thumbnail = await getGraphSnapshot(sigma.getGraph(), sigma.getSettings(), {
                    width: 800,
                    height: 600,
                    backgroundColor,
                    cameraState: sigma.getCamera().getState(),
                    ratio: 1,
                  });

                  if (thumbnail) {
                    console.log(`[Header] Thumbnail generated for save. Size: ${thumbnail.size}, Type: ${thumbnail.type}`);
                  } else {
                    console.error("[Header] Thumbnail generation returned null/undefined.");
                  }

                  await saveFile(thumbnail || undefined);
                  notify({
                    type: "success",
                    message: t("graph.save.github.success", { filename: currentFile?.filename }).toString(),
                  });
                } catch (e) {
                  console.error(e);
                  notify({ type: "error", message: t("graph.save.github.error").toString() });
                }
              },
            },
          ]
          : []),


      ] as Option[],
    [t, user, openModal, notify, resetGraph, currentFile, saveFile, backgroundColor, sigma],
  );



  return (
    <header className="gl-container-high-bg container-fluid border-bottom">
      <AnimateHeight height={expanded ? "auto" : 0} className="position-relative d-sm-none" duration={400}>
        <div className="d-flex flex-column align-items-stretch">
          <section className="d-flex flex-row">
            <div className="flex-grow-1">
              <Dropdown options={workspaceMenuList}>
                <button className="gl-btn">{t("workspace.title")}</button>
              </Dropdown>
            </div>

          </section>
        </div>
      </AnimateHeight>

      <section className="row gx-0">
        <div className="col-2 col-sm-4 d-flex justify-content-start align-items-center">
          {/* Tablet and desktop display: */}
          <Dropdown options={workspaceMenuList} className="d-none d-sm-block">
            <button className="gl-btn dropdown-toggle">{t("workspace.title")}</button>
          </Dropdown>
          {/* Mobile display: */}
          {children}
        </div>
        <div className="col-8 col-sm-4 d-flex justify-content-center align-items-center gl-gap-1">
          <Link to="/" className={cx("gl-btn", location.pathname === "/" && "gl-btn-fill")}>
            {location.pathname === "/" ? <GraphIconFill /> : <GraphIcon />} {t("pages.graph")}
          </Link>
          <Link
            to={`/data/${dataTableItemType}`}
            className={cx("gl-btn", location.pathname.startsWith("/data") && "gl-btn-fill")}
          >
            {location.pathname.startsWith("/data") ? <DataIconFill /> : <DataIcon />} {t("pages.data")}
          </Link>
        </div>
        <section className="col-2 col-sm-4 d-flex justify-content-end align-items-center">
          {/* Tablet and desktop display: */}
          <div className="d-none d-sm-flex">

          </div>
          {/* Mobile display: */}
          <button className="gl-btn gl-btn-icon d-sm-none" onClick={() => setExpanded((v) => !v)}>
            {expanded ? <PiX /> : <PiList />}
          </button>
        </section>
      </section>
    </header>
  );
};
