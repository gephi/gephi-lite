import cx from "classnames";
import FileSaver from "file-saver";
import { capitalize } from "lodash";
import { type FC, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router";

import GephiLogo from "../../assets/gephi-logo.svg?react";
import Dropdown, { type Option } from "../../components/Dropdown";
import LocalSwitcher from "../../components/LocalSwitcher";
import { ThemeSwitcher } from "../../components/ThemeSwitcher";
import { DataIcon, DataIconFill, GraphIcon, GraphIconFill } from "../../components/common-icons";
import ConfirmModal from "../../components/modals/ConfirmModal";
import { GithubLoginModal } from "../../components/modals/GithubLoginModal";
import { WelcomeModal } from "../../components/modals/WelcomeModal";
import { OpenModal } from "../../components/modals/open/OpenModal";
import { ExportPNGModal } from "../../components/modals/save/ExportPNGModal";
import { openInNewTab } from "../../core/broadcast/utils";
import { useCloudProvider } from "../../core/cloud/useCloudProvider";
import { useFile, useFileActions, useGraphDatasetActions } from "../../core/context/dataContexts";
import { getFilename } from "../../core/file/utils";
import { useModal } from "../../core/modals";
import { useNotifications } from "../../core/notifications";
import { useConnectedUser } from "../../core/user";

export const Header: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [user, setUser] = useConnectedUser();
  const { openModal } = useModal();
  const { notify } = useNotifications();
  const { resetGraph } = useGraphDatasetActions();
  const { saveFile } = useCloudProvider();
  const { exportAsGexf } = useFileActions();
  const { current: currentFile } = useFile();

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
          onClick: () => openModal({ component: WelcomeModal, arguments: {} }),
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
        onClick: () =>
          openModal({
            component: WelcomeModal,
            arguments: {},
          }),
      },
      { label: t("gephi-lite.github_link"), url: "https://github.com/gephi/gephi-lite" },
    ],
    [t, openModal],
  );

  return (
    <header className="gl-container-high-bg container-fluid gl-border gl-px-3">
      <div className="row gx-0">
        <div className="col-4 d-flex justify-content-start align-items-center">
          <Dropdown options={workspaceMenuList}>
            <button className="gl-btn dropdown-toggle">Workspace</button>
          </Dropdown>
        </div>
        <div className="col-4 d-flex justify-content-center align-items-center gl-gap-1">
          <Link to="/" className={cx("gl-btn", location.pathname === "/" ? "gl-btn-fill" : "")}>
            {location.pathname === "/" ? <GraphIcon /> : <GraphIconFill />} {t("pages.graph")}
          </Link>
          <Dropdown
            options={["nodes", "edges"].map((type) => ({
              label: capitalize(t(`graph.model.${type}`)),
              onClick: () => navigate(`/data/${type}`),
            }))}
          >
            <button
              className={cx("gl-btn dropdown-toggle", location.pathname.startsWith("/data") ? "gl-btn-fill" : "")}
            >
              {location.pathname.startsWith("/data") ? <DataIcon /> : <DataIconFill />} {t("pages.data")}
            </button>
          </Dropdown>
        </div>
        <div className="col-4 d-flex justify-content-end align-items-center">
          <ThemeSwitcher />
          <LocalSwitcher />
          <Dropdown options={logoMenuList} side="right">
            <button className="gl-btn dropdown-toggle">
              <GephiLogo height={"1em"} width={"1em"} />
            </button>
          </Dropdown>
        </div>
      </div>
    </header>
  );
};
