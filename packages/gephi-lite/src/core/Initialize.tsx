import { parseAppearanceState } from "@gephi/gephi-lite-sdk";
import { FC, PropsWithChildren, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import useKonami from "react-use-konami";

import { WelcomeModal } from "../components/modals/WelcomeModal";
import { I18n } from "../locales/provider";
import { sessionStorage } from "../utils/storage";
import { extractFilename } from "../utils/url";
import { appearanceAtom } from "./appearance";
import { useBroadcast } from "./broadcast/useBroadcast";
import { resetStates, useFile, useFileActions, useGraphDataset } from "./context/dataContexts";
import { filtersAtom } from "./filters";
import { parseFiltersState } from "./filters/utils";
import { graphDatasetAtom } from "./graph";
import { ensureSystemDatesInDataset } from "./graph/dates";
import { parseDataset } from "./graph/utils";
import { useModal } from "./modals";
import { useNotifications } from "./notifications";
import { preferencesAtom } from "./preferences";
import { getCurrentPreferences } from "./preferences/utils";
import { sessionAtom } from "./session";
import { getEmptySession, parseSession } from "./session/utils";
import { resetCamera } from "./sigma";
import { AuthInit } from "./user/AuthInit";

// This awful flag helps to deal with the double rendering caused from
// React.StrictMode:
// https://react.dev/reference/react/StrictMode#fixing-bugs-found-by-double-rendering-in-development
let isInitialized = false;

export const Initialize: FC<PropsWithChildren<unknown>> = ({ children }) => {
  const { t } = useTranslation();
  const { notify } = useNotifications();
  const { modal, openModal, closeModal } = useModal();
  const { open } = useFileActions();
  const { metadata } = useGraphDataset();
  const { isDirty } = useFile();
  const [broadcastID, setBroadcastID] = useState<string | null>(null);
  useBroadcast(broadcastID);

  /**
   * Guard against losing unsaved work when leaving the app (Android/browser back that exits, tab
   * close, reload...): while there are unsaved changes, ask the browser to show its native
   * "leave site?" confirmation. It only triggers when actually leaving the document, so it never
   * interferes with in-app navigation between the Graph and Data views.
   */
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Legacy browsers require returnValue to be set for the prompt to show:
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  /**
   * Make the Android/browser back button close the currently open modal instead of navigating
   * the underlying page: neither modals nor the router have any history entry of their own for
   * "a dialog is open", so back would otherwise fall through to the router and step back and
   * forth between the Graph and Data pages. Push a throwaway history entry while a modal is open,
   * and consume it if the modal ends up closing some other way (Cancel, submit, click outside...),
   * so the entry doesn't linger for a later, real, back press.
   */
  useEffect(() => {
    if (!modal) return;

    window.history.pushState({ gephiLiteModal: true }, "");
    let closedFromPopState = false;
    const handlePopState = () => {
      closedFromPopState = true;
      closeModal();
    };
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      if (!closedFromPopState) window.history.back();
    };
    // Only the "a modal is open" transition matters here, not which modal it is exactly:
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!modal]);

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
    if (isInitialized) return;
    isInitialized = true;

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
    let showWelcomeModal = true;
    const url = new URL(window.location.href);
    const broadcastID = url.searchParams.get("broadcast");
    setBroadcastID(broadcastID);

    // If query params has new
    // => empty graph & open welcome modal
    if (url.searchParams.has("new") || broadcastID) {
      // Full workspace reset (file pointer included), so a fresh/broadcast tab never inherits and
      // overwrites a file left over from a previous session.
      resetStates(false);
      graphFound = true;
      url.searchParams.delete("new");
      window.history.pushState({}, "", url);
      showWelcomeModal = false;
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
        showWelcomeModal = false;
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

          graphDatasetAtom.set(ensureSystemDatesInDataset(dataset));
          filtersAtom.set((prev) => filters || prev);
          appearanceAtom.set((prev) => appearance || prev);
          resetCamera({ forceRefresh: true });

          if (dataset.fullGraph.order > 0) showWelcomeModal = false;
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

    if (showWelcomeModal)
      openModal({
        component: WelcomeModal,
        arguments: {},
      });
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

  /**
   * Update document title:
   */
  useEffect(() => {
    document.title = metadata.title ? `Gephi Lite - ${metadata.title}` : "Gephi Lite";
  }, [metadata.title]);

  return (
    <I18n>
      <AuthInit />
      {children}
    </I18n>
  );
};
