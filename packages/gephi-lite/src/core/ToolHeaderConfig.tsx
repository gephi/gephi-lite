import FileSaver from "file-saver";
import { FC, MutableRefObject, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { ExportPNGModal } from "../components/modals/export/ExportPNGModal";
import { OpenLocalFileModal } from "../components/modals/open/LocalFileModal";
import { getGraphSnapshot } from "../utils/sigma";
import { useAppearance, useFile, useFileActions, useSigmaAtom } from "./context/dataContexts";
import { getFilename } from "./file/utils";
import { useModal } from "./modals";
import { useNotifications } from "./notifications";
import { installGephiLiteSamplePicker } from "./samplePicker";
import {
  type ToolHeaderButton,
  type ToolHeaderElement,
  type ToolHeaderProjectConfig,
  type ToolHeaderProjectMeta,
  type ToolHeaderSampleConfig,
  getToolHeader,
  installHeaderProcessingToasts,
  showProcessingToast,
} from "./toolHeader";

const SAMPLES = ["Les Miserables.json", "Java.gexf", "Power Grid.gexf"];
const SAMPLE_FORMAT_EXTENSIONS: Record<string, string> = {
  gexf: "gexf",
  graphml: "graphml",
  json: "json",
};

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function getSampleFilename(detail: { url: string; format: string; name: string }): string {
  try {
    const file = decodeURIComponent(new URL(detail.url, window.location.href).pathname.split("/").pop() || "");
    if (file.includes(".")) return file;
  } catch (_e) {
    // Fallback to name + format below.
  }

  const extension = SAMPLE_FORMAT_EXTENSIONS[detail.format] || detail.format || "gexf";
  return detail.name.endsWith(`.${extension}`) ? detail.name : `${detail.name}.${extension}`;
}

function useToolHeaderElement(): ToolHeaderElement | null {
  const [header, setHeader] = useState<ToolHeaderElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    customElements.whenDefined("dataviz-tool-header").then(() => {
      if (!cancelled) setHeader(getToolHeader());
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return header;
}

function useToolHeaderButtons(header: ToolHeaderElement | null): ToolHeaderButton[] {
  const { openModal } = useModal();
  const { open, exportAsGexf, exportAsGephiLite } = useFileActions();
  const { current: currentFile } = useFile();
  const { notify } = useNotifications();
  const { t } = useTranslation();
  const sigma = useSigmaAtom();
  const { backgroundColor } = useAppearance();

  return useMemo(
    () => [
      {
        label: t("header.open_data_file"),
        action: () => openModal({ component: OpenLocalFileModal, arguments: {} }),
        align: "left",
      },
      {
        label: t("header.open_sample"),
        type: "dropdown",
        align: "left",
        items: SAMPLES.map((sample) => ({
          label: sample,
          action: async () => {
            try {
              showProcessingToast(t("processing.sample"));
              await open({
                type: "remote",
                url: `${import.meta.env.BASE_URL}samples/${sample}`,
                filename: sample,
              });
              notify({
                type: "success",
                message: t("graph.open.remote.success", { filename: sample }),
                title: t("gephi-lite.title"),
              });
            } catch (e) {
              console.error(e);
              notify({
                type: "error",
                message: t("graph.open.remote.error"),
                title: t("gephi-lite.title"),
              });
            }
          },
        })),
      },
      {
        label: t("header.open_project"),
        action: () => {
          header?.showLoadModal?.();
        },
        align: "right",
      },
      {
        label: t("header.save_project"),
        action: async () => {
          try {
            showProcessingToast(t("processing.savePrep"));
            const thumbnail = await getGraphSnapshot(sigma.getGraph(), sigma.getSettings(), {
              width: 800,
              height: 600,
              backgroundColor,
              cameraState: sigma.getCamera().getState(),
              ratio: 1,
            });

            let projectData: object = {};
            await exportAsGephiLite(async (content) => {
              projectData = JSON.parse(content);
            });

            header?.showSaveModal?.({
              name: currentFile?.filename || "Gephi Lite Project",
              data: projectData,
              thumbnailDataUri: thumbnail ? await blobToDataUrl(thumbnail) : null,
              existingProjectId: currentFile?.type === "cloud" ? currentFile.id : null,
            });
          } catch (e) {
            console.error(e);
            notify({
              type: "error",
              message: t("graph.save.error", { error: (e as Error).message }),
            });
          }
        },
        align: "right",
      },
      {
        label: t("header.export"),
        type: "dropdown",
        align: "right",
        items: [
          {
            label: t("header.export_png"),
            action: () => openModal({ component: ExportPNGModal, arguments: {} }),
          },
          {
            label: t("header.export_gexf"),
            action: async () => {
              try {
                showProcessingToast(t("processing.export"));
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
        ],
      },
    ],
    [backgroundColor, currentFile, exportAsGephiLite, exportAsGexf, header, notify, open, openModal, sigma, t],
  );
}

function useToolHeaderProjectConfig(
  header: ToolHeaderElement | null,
  currentLoadedProjectId: MutableRefObject<string | null>,
  currentLoadedProjectName: MutableRefObject<string | null>,
): ToolHeaderProjectConfig {
  const { openFromData, setCurrentFile } = useFileActions();
  const { notify } = useNotifications();

  return useMemo(
    () => ({
      appName: "gephi-lite",
      onProjectLoad: async (projectData: object) => {
        try {
          const selectedProjectId = header?._currentSelectedProjectId;
          const projectName = currentLoadedProjectName.current || "Gephi Lite Project";
          const projectId = selectedProjectId || currentLoadedProjectId.current || "";

          if (projectId) currentLoadedProjectId.current = projectId;

          await openFromData(projectData, projectName, projectId);
          notify({
            type: "success",
            message: "プロジェクトを読み込みました",
          });
        } catch (e) {
          console.error(e);
          notify({
            type: "error",
            message: "プロジェクトの読み込みに失敗しました",
          });
        }
      },
      onProjectSave: (meta: ToolHeaderProjectMeta) => {
        currentLoadedProjectId.current = meta.id;
        currentLoadedProjectName.current = meta.name;
        setCurrentFile({
          type: "cloud",
          id: meta.id,
          filename: meta.name,
          description: meta.description || "",
          createdAt: meta.created_at ? new Date(meta.created_at) : new Date(),
          updatedAt: meta.updated_at ? new Date(meta.updated_at) : new Date(),
          isPublic: meta.isPublic || false,
          size: 0,
          format: "gephi-lite",
        });
        notify({
          type: "success",
          message: meta.name ? `${meta.name} saved` : "Project saved",
        });
      },
    }),
    [currentLoadedProjectId, currentLoadedProjectName, header, notify, openFromData, setCurrentFile],
  );
}

function useToolHeaderSampleConfig(): ToolHeaderSampleConfig {
  const { open } = useFileActions();
  const { notify } = useNotifications();
  const { t } = useTranslation();

  return useMemo(
    () => ({
      toolId: "gephi-lite",
      onSampleSelect: async (detail: { url: string; format: string; name: string; nameEn?: string }) => {
        try {
          showProcessingToast(t("processing.sample"));
          await open({
            type: "remote",
            url: detail.url,
            filename: getSampleFilename(detail),
          });
          notify({
            type: "success",
            message: t("graph.open.remote.success", { filename: detail.name }),
            title: t("gephi-lite.title"),
          });
        } catch (e) {
          console.error(e);
          notify({
            type: "error",
            message: t("graph.open.remote.error"),
            title: t("gephi-lite.title"),
          });
        }
      },
    }),
    [notify, open, t],
  );
}

export const ToolHeaderConfig: FC = () => {
  const { t } = useTranslation();
  const header = useToolHeaderElement();
  const currentLoadedProjectId = useRef<string | null>(null);
  const currentLoadedProjectName = useRef<string | null>(null);
  const buttons = useToolHeaderButtons(header);
  const projectConfig = useToolHeaderProjectConfig(header, currentLoadedProjectId, currentLoadedProjectName);
  const sampleConfig = useToolHeaderSampleConfig();

  useEffect(() => {
    if (!header?.setConfig || !header.setProjectConfig || !header.setSampleConfig) return;

    installGephiLiteSamplePicker();
    installHeaderProcessingToasts(header, t);
    header.setConfig({
      logo: {
        type: "text",
        text: "Gephi Lite",
        textClass: "font-bold text-lg text-white",
      },
      buttons,
    });
    header.setProjectConfig(projectConfig);
    header.setSampleConfig(sampleConfig);
  }, [buttons, header, projectConfig, sampleConfig, t]);

  return null;
};
