import cx from "classnames";
import FileSaver from "file-saver";
import { type FC, PropsWithChildren, useMemo, useState } from "react";
import AnimateHeight from "react-animate-height";
import { useTranslation } from "react-i18next";
import { PiList, PiX } from "react-icons/pi";
import { Link, useLocation } from "react-router";

import GephiLogo from "../../assets/gephi-logo.svg?react";
import Dropdown, { type Option } from "../../components/Dropdown";
import LocalSwitcher from "../../components/LocalSwitcher";
import { ThemeSwitcher } from "../../components/ThemeSwitcher";
import {
  BugIcon,
  DataIcon,
  DataIconFill,
  GitHubIcon,
  GraphIcon,
  GraphIconFill,
  HomeIcon,
} from "../../components/common-icons";
import ConfirmModal from "../../components/modals/ConfirmModal";
import { GithubLoginModal } from "../../components/modals/GithubLoginModal";
import { WelcomeModal } from "../../components/modals/WelcomeModal";
import { ExportPNGModal } from "../../components/modals/export/ExportPNGModal";
import { OpenModal } from "../../components/modals/open/OpenModal";
import { SaveAsModal } from "../../components/modals/save/SaveAsModal";
import { openInNewTab } from "../../core/broadcast/utils";
import { useCloudProvider } from "../../core/cloud/useCloudProvider";
import { useDataTable, useFile, useFileActions, useGraphDatasetActions } from "../../core/context/dataContexts";
import { getFilename } from "../../core/file/utils";
import { useModal } from "../../core/modals";
import { useNotifications } from "../../core/notifications";
import { useConnectedUser } from "../../core/user";

export const Header: FC<PropsWithChildren> = ({ children }) => {
  const location = useLocation();
  const { t } = useTranslation();
  const [user, setUser] = useConnectedUser();
  const { openModal } = useModal();
  const { notify } = useNotifications();
  const { type: dataTableItemType } = useDataTable();
  const { resetGraph } = useGraphDatasetActions();
  const { saveFile } = useCloudProvider();
  const { exportAsGexf } = useFileActions();
  const { current: currentFile } = useFile();

  // For mobile burger menu:
  const [expanded, setExpanded] = useState(false);

  const workspaceMenuList = useMemo(
    () =>
      [
        {
          label: t("workspace.menu.open"),
          onClick: () => openModal({ component: OpenModal, arguments: {} }),
        },
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
          label: t("workspace.menu.duplicate"),
          onClick: async () => {
            await openInNewTab();
            notify({
              type: "success",
              message: t("graph.clone_in_new_tab.success").toString(),
            });
          },
        },
        { type: "divider" },
        ...(currentFile?.type === "cloud" && currentFile?.format === "gephi-lite" && user
          ? [
              {
                label: t("workspace.menu.save"),
                onClick: async () => {
                  try {
                    await saveFile();
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
        {
          label: t("workspace.menu.save_as"),
          onClick: () => openModal({ component: SaveAsModal, arguments: {} }),
        },
        { type: "divider" },
        {
          label: t("workspace.menu.export_image"),
          onClick: () => openModal({ component: ExportPNGModal, arguments: {} }),
        },
        {
          label: t("workspace.menu.export_graph_file"),
          onClick: async () => {
            try {
              await exportAsGexf((content) => {
                FileSaver(new Blob([content]), getFilename(currentFile?.filename || "gephi-lite", "gexf"));
              });
              notify({ type: "success", message: t("graph.export.gexf.success").toString() });
            } catch (e) {
              console.error(e);
              notify({ type: "error", message: t("graph.export.gexf.error").toString() });
            }
          },
        },
        { type: "divider" },
        ...(user
          ? [
              {
                label: t("workspace.menu.github_signout"),
                onClick: () =>
                  openModal({
                    component: ConfirmModal,
                    beforeSubmit: () => {
                      setUser(null);
                    },
                    arguments: {
                      title: t("cloud.github.disconnect.title"),
                      message: t("cloud.github.disconnect.message"),
                      confirmMsg: t("cloud.github.disconnect.action"),
                      successMsg: t("cloud.github.disconnect.success"),
                    },
                  }),
              },
            ]
          : [
              {
                label: t("workspace.menu.github_signin"),
                onClick: () => openModal({ component: GithubLoginModal, arguments: {} }),
              },
            ]),
      ] as Option[],
    [t, user, openModal, notify, resetGraph, setUser, exportAsGexf, currentFile, saveFile],
  );

  const logoMenuList = useMemo(
    () => [
      {
        label: t("gephi-lite.open_welcome_modal"),
        icon: <HomeIcon />,
        onClick: () =>
          openModal({
            component: WelcomeModal,
            arguments: {},
          }),
      },
      { label: t("gephi-lite.github_link"), icon: <GitHubIcon />, url: "https://github.com/gephi/gephi-lite" },
      { label: t("gephi-lite.report_issue"), icon: <BugIcon />, url: "https://github.com/gephi/gephi-lite/issues/new" },
    ],
    [t, openModal],
  );

  return (
    <header className="gl-container-high-bg container-fluid border-bottom">
      <AnimateHeight height={expanded ? "auto" : 0} className="position-relative d-sm-none" duration={400}>
        <div className="d-flex flex-column align-items-stretch">
          <section className="d-flex flex-row">
            <div className="flex-grow-1">
              <Dropdown options={workspaceMenuList}>
                <button className="gl-btn">Workspace</button>
              </Dropdown>
            </div>
            <ThemeSwitcher />
            <LocalSwitcher />
            {logoMenuList.map(({ label, icon, onClick, url }, i) =>
              url ? (
                <a key={i} className="gl-btn" href={url} target="_blank" rel="noreferrer" title={label}>
                  {icon}
                </a>
              ) : (
                <button key={i} className="gl-btn" onClick={onClick} title={label}>
                  {icon}
                </button>
              ),
            )}
          </section>
        </div>
      </AnimateHeight>

      <section className="row gx-0">
        <div className="col-2 col-sm-4 d-flex justify-content-start align-items-center">
          {/* Tablet and desktop display: */}
          <Dropdown options={workspaceMenuList} className="d-none d-sm-block">
            <button className="gl-btn dropdown-toggle">Workspace</button>
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
            <ThemeSwitcher />
            <LocalSwitcher />
            <Dropdown options={logoMenuList} side="right">
              <button className="gl-btn dropdown-toggle">
                <GephiLogo height="1em" width="1em" />
              </button>
            </Dropdown>
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
