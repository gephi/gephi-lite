import { parseAppearanceState } from "@gephi/gephi-lite-sdk";
import { FC, PropsWithChildren, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import useKonami from "react-use-konami";

import { WelcomeModal } from "../components/modals/WelcomeModal";
import { config } from "../config";
import { I18n } from "../locales/provider";
import { pruneStaleTabStorage, tabStorage, tagHistoryState } from "../utils/storage";
import { extractFilename } from "../utils/url";
import { appearanceAtom } from "./appearance";
import { useBroadcast } from "./broadcast/useBroadcast";
import { useRemoteFileGuard } from "./cloud/useRemoteFileGuard";
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
import { SELECTION_ENTRY_KEY, getCurrentEntry, goToSelectionEntry, selectionHistoryAtom } from "./selection/history";
import { sessionAtom } from "./session";
import { getEmptySession, parseSession } from "./session/utils";
import { restoreCamera } from "./sigma";
import { AuthInit } from "./user/AuthInit";

// This awful flag helps to deal with the double rendering caused from
// React.StrictMode:
// https://react.dev/reference/react/StrictMode#fixing-bugs-found-by-double-rendering-in-development
let isInitialized = false;

export const Initialize: FC<PropsWithChildren<unknown>> = ({ children }) => {
  const { t } = useTranslation();
  const { notify } = useNotifications();
  const { modal, openModal, requestCloseModal } = useModal();
  const { open, setDirty } = useFileActions();
  const { metadata } = useGraphDataset();
  const { isDirty } = useFile();
  const [broadcastID, setBroadcastID] = useState<string | null>(null);
  useBroadcast(broadcastID);

  // Warn when starting to edit a GitHub graph whose remote version has changed since it was opened:
  useRemoteFileGuard();

  // The back-button guard below is set up once on mount; it reads the always-current modal /
  // dirty / t through refs instead of re-subscribing on every change.
  const modalRef = useRef(modal);
  modalRef.current = modal;
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;
  const requestCloseModalRef = useRef(requestCloseModal);
  requestCloseModalRef.current = requestCloseModal;
  const tRef = useRef(t);
  tRef.current = t;
  const notifyRef = useRef(notify);
  notifyRef.current = notify;

  /**
   * Map the nodes and edges visited in this tab onto the browser's own history, so back and
   * forward walk through them like through visited web pages (see core/selection/history), and so
   * the app is not left on the first back press - which would lose unsaved work:
   * - Every visited selection gets its own history entry, carrying its id. Landing on one, in
   *   either direction, displays it back: the browser decides where the user wants to go (it may
   *   well jump several entries at once), this only replays it.
   * - When a modal is open, back closes it instead, and the navigation is undone: a modal is not a
   *   step in the history. A modal holding unsaved input raises its own confirmation rather than
   *   closing (see `requestCloseModal`).
   * - Going back past the first visited selection means leaving the app: a first back only
   *   announces it, and it is left for real when back is pressed again while that message is still
   *   on screen - and, with unsaved changes, after confirming it.
   * A beforeunload handler additionally covers reload / tab close (where mobile browsers, e.g.
   * Firefox Android, do not fire the back-button popstate at all).
   */
  useEffect(() => {
    // Browser entries only carry the id of the visited selection: their content lives in
    // core/selection/history, which is free to forget the oldest ones without invalidating it.
    const pushEntry = (id: number) => {
      window.history.pushState(tagHistoryState({ [SELECTION_ENTRY_KEY]: id }), "");
      pushedEntryIds.add(id);
    };
    const pushedEntryIds = new Set<number>();
    const currentEntry = getCurrentEntry();
    if (currentEntry) pushEntry(currentEntry.id);

    let leaving = false;
    // When the "press back again to leave" message was shown. Leaving is only confirmed while it
    // is still displayed, so the message and the window it opens always say the same thing.
    let leaveAnnouncedAt = 0;
    // Set while we navigate the history ourselves, to undo a navigation we do not want to honour:
    // the popstate it triggers in turn is ours, and lands back where we already are.
    let undoingNavigation = false;

    // Puts the browser back on the entry being displayed, after a navigation we chose not to
    // honour. Which way depends on where the user was heading.
    const undoNavigation = (targetIndex: number) => {
      undoingNavigation = true;
      if (targetIndex < selectionHistoryAtom.get().cursor) window.history.forward();
      else window.history.back();
    };

    const handlePopState = (event: PopStateEvent) => {
      if (undoingNavigation) {
        undoingNavigation = false;
        return;
      }

      const state = event.state as Record<string, unknown> | null;
      const targetId = typeof state?.[SELECTION_ENTRY_KEY] === "number" ? (state[SELECTION_ENTRY_KEY] as number) : null;
      // -1 when the entry is not one of ours anymore: the user went back past the first visited
      // selection, i.e. out of the application.
      const targetIndex =
        targetId === null ? -1 : selectionHistoryAtom.get().visited.findIndex((entry) => entry.id === targetId);

      if (modalRef.current) {
        // Priority: close the open modal, and stay where we are.
        requestCloseModalRef.current();
        undoNavigation(targetIndex);
        return;
      }
      if (targetId !== null && goToSelectionEntry(targetId)) {
        // Back (or forward) to another visited node/edge: nothing to announce anymore.
        leaveAnnouncedAt = 0;
        return;
      }
      if (Date.now() - leaveAnnouncedAt > config.notificationTimeoutMs) {
        // Nothing left to come back to: warn once, and stay.
        leaveAnnouncedAt = Date.now();
        notifyRef.current({ type: "info", message: tRef.current("workspace.confirm_leave_press_back_again") });
        undoNavigation(targetIndex);
        return;
      }
      if (isDirtyRef.current && !window.confirm(tRef.current("workspace.confirm_leave_unsaved"))) {
        // Unsaved changes and the user chose to stay:
        leaveAnnouncedAt = 0;
        undoNavigation(targetIndex);
        return;
      }
      // Let the app be left for real (nothing unsaved, or the user confirmed): stop guarding and
      // step back through what is left of our own entries, until the browser leaves this document
      // - at which point this code is gone. A single back would only undo the last of them:
      // selections visited before the graph was replaced still have an entry each.
      leaving = true;
      window.removeEventListener("popstate", handlePopState);
      let remainingSteps = pushedEntryIds.size + 1;
      const stepOut = () => {
        if (remainingSteps-- > 0) window.history.back();
        else window.removeEventListener("popstate", stepOut);
      };
      window.addEventListener("popstate", stepOut);
      stepOut();
    };

    // A newly visited selection becomes a new browser entry, so back can come back to the one it
    // replaces. Ids already pushed are the ones we are navigating through, nothing to add.
    const handleVisitedSelection = () => {
      const entry = getCurrentEntry();
      if (entry && !pushedEntryIds.has(entry.id)) pushEntry(entry.id);
    };
    selectionHistoryAtom.bind(handleVisitedSelection);

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
      selectionHistoryAtom.unbind(handleVisitedSelection);
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

    // Forget the workspace snapshots of tabs that are long gone (see tabStorage):
    pruneStaleTabStorage();

    // Load session from local storage
    sessionAtom.set(() => {
      const raw = tabStorage.getItem("session");
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
      window.history.replaceState(tagHistoryState(), "", url);
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
        window.history.replaceState(tagHistoryState(), "", url);
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
      // Load the workspace snapshot left by this tab (see tabStorage). Everything is read up front:
      // setting the atoms below flips isDirty through the markDirty bindings, which rewrites the
      // stored flag - reading it afterwards would only ever read back that "true".
      const rawDataset = tabStorage.getItem("dataset");
      const rawFilters = tabStorage.getItem("filters");
      const rawAppearance = tabStorage.getItem("appearance");
      const wasDirty = tabStorage.getItem("isDirty") === "true";

      if (rawDataset) {
        const dataset = parseDataset(rawDataset);

        if (dataset) {
          const appearance = rawAppearance ? parseAppearanceState(rawAppearance) : null;
          const filters = rawFilters ? parseFiltersState(rawFilters) : null;

          graphDatasetAtom.set(ensureSystemDatesInDataset(dataset));
          filtersAtom.set((prev) => filters || prev);
          appearanceAtom.set((prev) => appearance || prev);
          restoreCamera({ forceRefresh: true });
          // Restoring the workspace is not a user edit: the atom updates above just flipped isDirty
          // to true, whatever it really was. Put back the flag the snapshot was taken with, so a
          // graph left with unsaved changes comes back with its "unsaved changes" star, and a saved
          // one comes back without.
          setDirty(wasDirty);

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
      history.replaceState(tagHistoryState(), "", cleanedURL);
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
