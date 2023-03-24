import { FC, PropsWithChildren, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import useKonami from "react-use-konami";

import { extractFilename } from "../utils/url";
import { AuthInit } from "./user/AuthInit";
import { Loader } from "../components/Loader";
import { useNotifications } from "./notifications";
import { graphDatasetAtom } from "./graph";
import { useOpenGexf } from "./graph/useOpenGexf";
import { parseDataset, getEmptyGraphDataset } from "./graph/utils";
import { filtersAtom } from "./filters";
import { parseFiltersState } from "./filters/utils";
import { appearanceAtom } from "./appearance";
import { parseAppearanceState } from "./appearance/utils";
import { preferencesAtom } from "./preferences";
import { parsePreferences } from "./preferences/utils";
import { useModal } from "./modals";
import { WelcomeModal } from "../views/graphPage/modals/WelcomeModal";
import { resetCamera } from "./sigma";

export const Initialize: FC<PropsWithChildren<unknown>> = ({ children }) => {
  const { t } = useTranslation();
  const { notify } = useNotifications();
  const { openModal } = useModal();
  const { loading, openRemoteFile } = useOpenGexf();

  useKonami(
    () => {
      notify({
        type: "error",
        title: "NullPointerException",
        message:
          "We're kidding, gephi-lite is written with love in Javascript not in Java like Gephi. So now we have `undefined` errors :)",
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
    // Load preferences from local storage
    preferencesAtom.set((prev) => {
      const raw = localStorage.getItem("preferences");
      const parsed = raw ? parsePreferences(raw) : null;
      if (parsed) {
        return {
          ...prev,
          ...parsed,
        };
      }
      return prev;
    });

    // Load a graph
    // ~~~~~~~~~~~~
    let graphFound = false;
    let showWelcomeModal = true;
    const url = new URL(window.location.href);

    // If query params has new
    // => empty graph & open welcome modal
    if (url.searchParams.has("new")) {
      graphDatasetAtom.set(getEmptyGraphDataset());
      graphFound = true;
      url.searchParams.delete("new");
      window.history.pushState({}, "", url);
    }

    // If query params has gexf
    // => try to load the file
    if (!graphFound && url.searchParams.has("gexf")) {
      const gexfUrl = url.searchParams.get("gexf") || "";
      try {
        await openRemoteFile({
          type: "remote",
          filename: extractFilename(gexfUrl),
          url: gexfUrl,
        });
        graphFound = true;
        showWelcomeModal = false;
        // remove param in url
        url.searchParams.delete("gexf");
        window.history.pushState({}, "", url);
      } catch (e) {
        console.error(e);
        notify({
          type: "error",
          message: t("init.cannot_load_remote", { url: gexfUrl }) as string,
          title: t("gephi-lite.title") as string,
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
          resetCamera();

          graphFound = true;
          if (dataset.fullGraph.order > 0) showWelcomeModal = false;
        }
      }
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
    initialize();
  }, [initialize]);

  return (
    <>
      <AuthInit />
      {loading ? <Loader /> : children}
    </>
  );
};
