import { parseAppearanceState } from "@gephi/gephi-lite-sdk";
import { FC, PropsWithChildren, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import useKonami from "react-use-konami";

// import { WelcomeModal } from "../components/modals/WelcomeModal";
import { I18n } from "../locales/provider";
import { extractFilename } from "../utils/url";
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
import { AuthInit } from "./user/AuthInit";
import { AuthSync } from "./user/AuthSync";
import { useConnectedUser } from "./user";

// This awful flag helps to deal with the double rendering caused from
// React.StrictMode:
// https://react.dev/reference/react/StrictMode#fixing-bugs-found-by-double-rendering-in-development
let isInitialized = false;
let isCloudLoadingStarted = false;

export const Initialize: FC<PropsWithChildren<unknown>> = ({ children }) => {
  console.log(`[${new Date().toISOString()}] Initialize component mounted`);
  const { t } = useTranslation();
  const { notify } = useNotifications();
  // const { openModal } = useModal();
  const { open } = useFileActions();
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
      console.log(`[${new Date().toISOString()}] initialize() skipped: already initialized`);
      return;
    }
    isInitialized = true;

    // If loading from cloud (project_id), skip all local initialization
    const url = new URL(window.location.href);
    if (url.searchParams.has("project_id")) {
      console.log(`[${new Date().toISOString()}] initialize() returned: project_id detected`);
      return;
    }
    console.log(`[${new Date().toISOString()}] initialize() proceeding with local init`);

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

  // Load project from cloud if project_id is in URL and user is connected
  const [user] = useConnectedUser();

  useEffect(() => {
    const url = new URL(window.location.href);
    const projectId = url.searchParams.get("project_id");

    const loadCloudProject = async () => {
      console.log(`[${new Date().toISOString()}] loadCloudProject called. user=${!!user}, projectId=${projectId}, globalFlag=${isCloudLoadingStarted}`);

      // Ensure we only load once globally (even across re-renders in Strict Mode)
      if (user && projectId && !isCloudLoadingStarted) {
        console.log(`[${new Date().toISOString()}] Starting cloud load...`);
        isCloudLoadingStarted = true;
        try {
          await open({
            type: "cloud",
            id: projectId,
            // Dummy metadata, provider will fetch content using id
            filename: "Loading.json",
            description: "",
            createdAt: new Date(),
            updatedAt: new Date(),
            isPublic: false,
            size: 0,
            format: "gephi-lite"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any);

          // Success! Clean up URL.
          console.log(`[${new Date().toISOString()}] Cloud load success`);
          url.searchParams.delete("project_id");
          window.history.pushState({}, "", url);

        } catch (e) {
          console.error("Failed to load cloud project:", e);
          notify({
            type: "error",
            title: t("gephi-lite.title"),
            message: "Failed to load project from cloud",
          });
          // On error, we might want to allow retry?
          // But 'Already being loaded' means it IS loading.
          // So let's NOT reset the flag here if the error is "Already being loaded".
          const errMsg = (e instanceof Error) ? e.message : String(e);
          if (!errMsg.includes("already being loaded")) {
            isCloudLoadingStarted = false; // Allow retry for other errors
          }
        }
      }
    };

    if (user && projectId) {
      loadCloudProject();
    } else {
      console.log(`[${new Date().toISOString()}] useEffect skipped load: user=${!!user}, projectId=${projectId}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Depends on user authentication status

  /**
   * Update document title:
   */
  useEffect(() => {
    document.title = metadata.title ? `Gephi Lite - ${metadata.title}` : "Gephi Lite";
  }, [metadata.title]);

  return (
    <I18n>
      <AuthInit />
      <AuthSync />
      {children}
    </I18n>
  );
};
