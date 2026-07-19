import { parseAppearanceState } from "@gephi/gephi-lite-sdk";
import { FC, PropsWithChildren, useCallback, useEffect, useRef, useState } from "react";
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
  const { open, clearDirty } = useFileActions();
  const { metadata } = useGraphDataset();
  const { isDirty } = useFile();
  const [broadcastID, setBroadcastID] = useState<string | null>(null);
  useBroadcast(broadcastID);

  // The back-button guard below is set up once on mount; it reads the always-current modal /
  // dirty / t through refs instead of re-subscribing on every change.
  const modalRef = useRef(modal);
  modalRef.current = modal;
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;
  const closeModalRef = useRef(closeModal);
  closeModalRef.current = closeModal;
  const tRef = useRef(t);
  tRef.current = t;

  /**
   * Keep the browser/Android back button from leaving the app (and losing unsaved work):
   * - A "guard" history entry is kept on top of the stack, so a back press lands on a popstate we
   *   control instead of navigating away or stepping through the router's Graph/Data history.
   * - When a modal is open, back closes it (and we keep guarding).
   * - Otherwise, back only leaves the app after a confirmation when there are unsaved changes;
   *   with nothing to save it leaves normally.
   * A beforeunload handler additionally covers reload / tab close (where mobile browsers, e.g.
   * Firefox Android, do not fire the back-button popstate at all).
   */
  useEffect(() => {
    const pushGuard = () => window.history.pushState({ gephiLiteBackGuard: true }, "");
    pushGuard();
    let leaving = false;

    const handlePopState = () => {
      // A back navigation just consumed our guard entry.
      if (modalRef.current) {
        // Priority: close an open modal, and keep guarding.
        closeModalRef.current();
        pushGuard();
        return;
      }
      if (isDirtyRef.current && !window.confirm(tRef.current("workspace.confirm_leave_unsaved"))) {
        // Unsaved changes and the user chose to stay: keep guarding.
        pushGuard();
        return;
      }
      // Let the app be left for real (nothing unsaved, or the user confirmed): stop guarding and
      // replay the back so the browser actually leaves.
      leaving = true;
      window.removeEventListener("popstate", handlePopState);
      window.history.back();
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Skipped when we are intentionally leaving (the popstate handler already confirmed):
      if (leaving || !isDirtyRef.current) return;
      e.preventDefault();
      // Legacy browsers require returnValue to be set for the prompt to show:
      e.returnValue = "";
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
    // Set up once; current values are read through refs.
  }, []);

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
      // replaceState (not pushState): just clean the URL, without adding a back-navigable entry
      // that would also bury the back-button guard entry (see the guard effect above).
      window.history.replaceState({}, "", url);
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
        // remove param in url (replaceState, not pushState: see the "new" branch above)
        url.searchParams.delete("file");
        window.history.replaceState({}, "", url);
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
          // Restoring the previous session's state (e.g. after a page reload) is not a user edit:
          // the atom updates above just flipped isDirty back to true through the markDirty
          // bindings (new object references), so it must be cleared again here.
          clearDirty();

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
