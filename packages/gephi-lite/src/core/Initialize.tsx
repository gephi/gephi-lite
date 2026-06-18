import { parseAppearanceState } from "@gephi/gephi-lite-sdk";
import { FC, PropsWithChildren, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import useKonami from "react-use-konami";

// import { WelcomeModal } from "../components/modals/WelcomeModal";
import { I18n } from "../locales/provider";
import { extractFilename } from "../utils/url";
import { ToolHeaderConfig } from "./ToolHeaderConfig";
import { appearanceAtom } from "./appearance";
import { useBroadcast } from "./broadcast/useBroadcast";
import { useFileActions, useGraphDataset, useGraphDatasetActions } from "./context/dataContexts";
import { filtersAtom } from "./filters";
import { parseFiltersState } from "./filters/utils";
import { graphDatasetAtom } from "./graph";
import { parseDataset } from "./graph/utils";
// import { useModal } from "./modals";
import { useNotifications } from "./notifications";
import { preferencesAtom } from "./preferences";
import { getCurrentPreferences } from "./preferences/utils";
import { sessionAtom } from "./session";
import { getEmptySession, parseSession } from "./session/utils";
import { resetCamera } from "./sigma";
import { getToolHeader, installHeaderProcessingToasts } from "./toolHeader";

// This awful flag helps to deal with the double rendering caused from
// React.StrictMode:
// https://react.dev/reference/react/StrictMode#fixing-bugs-found-by-double-rendering-in-development
let isInitialized = false;
let isCloudLoadingStarted = false;

function getProjectIdFromLocation(): string | null {
  const url = new URL(window.location.href);
  return url.searchParams.get("project_id") || window.GEPHI_LITE_PROJECT_ID || null;
}

export const Initialize: FC<PropsWithChildren<unknown>> = ({ children }) => {
  const { t } = useTranslation();
  const { notify } = useNotifications();
  // const { openModal } = useModal();
  const { open, openFromData, reset } = useFileActions();
  const { metadata } = useGraphDataset();
  const { resetGraph } = useGraphDatasetActions();
  const [broadcastID, setBroadcastID] = useState<string | null>(null);
  useBroadcast(broadcastID);

  useKonami(
    () => {
      notify({
        type: "warning",
        title: "Warning",
        message: "java.lang.RuntimeException: java.lang.NullPointerException",
      });
    },
    {
      code: [
        "ArrowUp",
        "ArrowUp",
        "ArrowDown",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "ArrowLeft",
        "ArrowRight",
        "b",
        "a",
      ],
    },
  );

  /**
   * Initialize the application by loading data from
   * - url
   * - local storage
   * - ...
   */
  const initialize = useCallback(async () => {
    if (isInitialized) {
      return;
    }
    isInitialized = true;

    // If loading from cloud (project_id), skip all local initialization
    const url = new URL(window.location.href);
    if (getProjectIdFromLocation()) {
      return;
    }

    // Load session from local storage
    sessionAtom.set(() => {
      const raw = sessionStorage.getItem("session");
      const parsed = raw ? parseSession(raw) : null;
      return parsed ?? getEmptySession();
    });

    // Load preferences from local storage
    preferencesAtom.set(getCurrentPreferences());

    // Load a graph
    // ~~~~~~~~~~~~
    let graphFound = false;
    // let showWelcomeModal = true;
    // const url = new URL(window.location.href);
    const broadcastID = url.searchParams.get("broadcast");
    setBroadcastID(broadcastID);

    // If query params has new
    // => empty graph & open welcome modal
    if (url.searchParams.has("new") || broadcastID) {
      resetGraph();
      graphFound = true;
      url.searchParams.delete("new");
      window.history.pushState({}, "", url);
      // showWelcomeModal = false;
    }

    // If query params has data_url, treat as file parameter
    if (!graphFound && url.searchParams.has("data_url")) {
      const dataUrl = url.searchParams.get("data_url") || "";
      try {
        await open({
          type: "remote",
          filename: dataUrl.split("/").pop() || "data",
          url: dataUrl,
        });
        graphFound = true;
        url.searchParams.delete("data_url");
        window.history.pushState({}, "", url);
      } catch (e) {
        console.error(e);
        notify({
          type: "error",
          message: t("graph.open.remote.error"),
          title: t("gephi-lite.title"),
        });
      }
    }

    // If query params has file (or GEXF, although it's deprecated)
    // => try to load the file
    if (!graphFound && (url.searchParams.has("file") || url.searchParams.has("gexf"))) {
      if (!url.searchParams.has("file") && url.searchParams.has("gexf"))
        notify({ type: "warning", message: t("error.deprecated.gexf_search_params") });

      const file = url.searchParams.get("file") || url.searchParams.get("gexf") || "";

      try {
        await open({
          type: "remote",
          filename: extractFilename(file),
          url: file,
        });
        graphFound = true;
        // showWelcomeModal = false;
        // remove param in url
        url.searchParams.delete("file");
        window.history.pushState({}, "", url);
      } catch (e) {
        console.error(e);
        notify({
          type: "error",
          message: t("graph.open.remote.error"),
          title: t("gephi-lite.title"),
        });
      }
    }

    if (!graphFound) {
      // Load data from session storage
      const rawDataset = sessionStorage.getItem("dataset");
      const rawFilters = sessionStorage.getItem("filters");
      const rawAppearance = sessionStorage.getItem("appearance");

      if (rawDataset) {
        const dataset = parseDataset(rawDataset);

        if (dataset) {
          const appearance = rawAppearance ? parseAppearanceState(rawAppearance) : null;
          const filters = rawFilters ? parseFiltersState(rawFilters) : null;

          graphDatasetAtom.set(dataset);
          filtersAtom.set((prev) => filters || prev);
          appearanceAtom.set((prev) => appearance || prev);
          resetCamera({ forceRefresh: true });

          // if (dataset.fullGraph.order > 0) showWelcomeModal = false;
        }
      }
    }

    // Clean URL:
    if (broadcastID) {
      const newSearch = new URLSearchParams(location.search);
      newSearch.delete("broadcast");
      const searchStr = newSearch.toString();
      const cleanedURL = location.pathname + (searchStr ? "?" + searchStr : "");
      history.replaceState(null, "", cleanedURL);
    }

    // if (showWelcomeModal)
    //   openModal({
    //     component: WelcomeModal,
    //     arguments: {},
    //   });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * When application is loaded
   * => run the initialize function
   */
  useEffect(() => {
    initialize().catch((error) => {
      console.error(error);
      notify({
        type: "error",
        title: t("error.title"),
        message: t("error.message"),
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialize]);

  useEffect(() => {
    const loadCloudProject = async () => {
      // Ensure we only load once globally (even across re-renders in Strict Mode)
      const projectId = getProjectIdFromLocation();
      if (!projectId || isCloudLoadingStarted) return;

      isCloudLoadingStarted = true;
      reset(true);

      try {
        await customElements.whenDefined("dataviz-tool-header");
        const headerEl = getToolHeader();
        if (!headerEl || typeof headerEl.loadProject !== "function") {
          throw new Error("dataviz-tool-header component not found");
        }
        installHeaderProcessingToasts(headerEl, t);

        const projectData = await headerEl.loadProject(projectId);
        if (projectData) {
          await openFromData(projectData, "Loaded Project", projectId);
        }

        const url = new URL(window.location.href);
        url.searchParams.delete("project_id");
        window.history.pushState({}, "", url);
        window.GEPHI_LITE_PROJECT_ID = undefined;

        notify({
          type: "success",
          title: t("gephi-lite.title"),
          message: "プロジェクトを読み込みました",
        });
      } catch (e) {
        console.error("Failed to load cloud project:", e);
        notify({
          type: "error",
          title: t("gephi-lite.title"),
          message: "Failed to load project from cloud",
        });
        const errMsg = e instanceof Error ? e.message : String(e);
        if (!errMsg.includes("already being loaded")) {
          isCloudLoadingStarted = false;
        }
      }
    };

    loadCloudProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openFromData, reset]);

  /**
   * Update document title:
   */
  useEffect(() => {
    document.title = metadata.title ? `Gephi Lite - ${metadata.title}` : "Gephi Lite";
  }, [metadata.title]);

  return (
    <I18n>
      <ToolHeaderConfig />
      {children}
    </I18n>
  );
};
