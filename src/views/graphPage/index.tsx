import { isEqual } from "lodash";
import { ComponentType, FC, useMemo, useState } from "react";
import cx from "classnames";
import { BsX } from "react-icons/bs";
import { HiChevronDoubleLeft, HiChevronDoubleRight } from "react-icons/hi";
import { useTranslation } from "react-i18next";

import { Layout } from "../layout";
import { GraphDataPanel } from "./GraphDataPanel";
import { StatisticsPanel } from "./StatisticsPanel";
import { AppearancePanel } from "./AppearancePanel";
import { FiltersPanel } from "./FiltersPanel";
import { LayoutsPanel } from "./LayoutsPanel";
import { GraphRendering } from "./GraphRendering";
import {
  AppearanceIcon,
  FileIcon,
  FiltersIcon,
  GraphIcon,
  LayoutsIcon,
  StatisticsIcon,
} from "../../components/common-icons";
import { useFilters } from "../../core/context/dataContexts";
import { useModal } from "../../core/modals";
import { WelcomeModal } from "./modals/WelcomeModal";
import { FilePanel } from "./FilePanel";
import { GitHubPanel } from "./GitHubPanel";
import { UserAvatar } from "../../components/user/UserAvatar";
import { ContextPanel } from "./ContextPanel";

type Tool = {
  type: "tool";
  label: string;
  icon: ComponentType<{ className?: string }>;
  panel: ComponentType;
  count?: number;
  countStatus?: "danger" | "warning" | "success" | "secondary";
};
type Button = { type: "button"; label: string; icon: ComponentType<{ className?: string }>; onClick: () => void };

const GephiLiteButton: FC = () => {
  const { t } = useTranslation();
  return (
    <img src={`${process.env.PUBLIC_URL}/gephi-logo.svg`} style={{ width: "2em" }} alt={t("welcome.logo") as string} />
  );
};

export const GraphPage: FC = () => {
  const [tool, setTool] = useState<Tool | null>(null);
  const [contextOpened, setContextOpened] = useState<boolean>(false);
  const { t } = useTranslation();
  const { openModal } = useModal();
  const filterState = useFilters();

  const TOOLS: (Tool | Button | { type: "space" } | { type: "filler" })[] = useMemo(
    () => [
      {
        type: "button",
        label: t("gephi-lite.title"),
        icon: GephiLiteButton,
        onClick: () => {
          openModal({
            component: WelcomeModal,
            arguments: {},
          });
        },
      },
      { type: "space" },
      { type: "tool", label: t("file.title"), icon: FileIcon, panel: FilePanel },
      { type: "tool", label: t("graph.title"), icon: GraphIcon, panel: GraphDataPanel },
      { type: "tool", label: t("statistics.title"), icon: StatisticsIcon, panel: StatisticsPanel },
      { type: "space" },
      { type: "tool", label: t("appearance.title"), icon: AppearanceIcon, panel: AppearancePanel },
      {
        type: "tool",
        label: t("filters.title"),
        icon: FiltersIcon,
        panel: FiltersPanel,
        count: filterState.future.length + filterState.past.length,
        countStatus: filterState.past.length === 0 && filterState.future.length > 0 ? "secondary" : "warning",
      },
      { type: "tool", label: t("layouts.title"), icon: LayoutsIcon, panel: LayoutsPanel },
      { type: "filler" },
      { type: "tool", label: t("github.title"), icon: UserAvatar, panel: GitHubPanel },
    ],
    [openModal, t, filterState],
  );

  return (
    <Layout>
      <div id="graph-page">
        <div className="toolbar d-flex flex-column pt-2 pb-1">
          {TOOLS.map((t, i) =>
            t.type === "space" ? (
              <br key={i} className="my-3" />
            ) : t.type === "filler" ? (
              <div key={i} className="flex-grow-1" />
            ) : (
              <button
                key={i}
                title={t.label}
                type="button"
                className={cx("d-flex justify-content-center fs-5 position-relative", isEqual(t, tool) && "active")}
                onClick={() => {
                  if (t.type === "tool") {
                    if (t === tool) setTool(null);
                    else setTool(t);
                  } else if (t.type === "button") {
                    t.onClick();
                  }
                }}
              >
                <t.icon />
                {t.type === "tool" && (t?.count || 0) > 0 && (
                  <span
                    style={{ fontSize: "10px !important" }}
                    className={cx(
                      "position-absolute translate-middle badge rounded-pill",
                      t.countStatus && `bg-${t.countStatus}`,
                    )}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            ),
          )}
        </div>
        {tool && (
          <div className="left-panel border-end position-relative">
            <button className="btn btn-icon btn-close-panel" aria-label="close panel" onClick={() => setTool(null)}>
              <BsX />
            </button>
            <tool.panel />
          </div>
        )}
        <div className="filler">
          <GraphRendering />
        </div>
        {contextOpened && (
          <div className="right-panel position-relative border-start">
            <button
              className="btn btn-icon btn-close-panel"
              aria-label="close panel"
              onClick={() => setContextOpened(false)}
            >
              <BsX />
            </button>
            <ContextPanel />
          </div>
        )}
        <div className="contextbar">
          <button
            className="btn btn-icon open-contextbar"
            aria-label="open context panel"
            onClick={() => {
              setContextOpened(!contextOpened);
            }}
          >
            {contextOpened ? <HiChevronDoubleRight /> : <HiChevronDoubleLeft />}
          </button>
        </div>
      </div>
    </Layout>
  );
};
