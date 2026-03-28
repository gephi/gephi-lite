import FileSaver from "file-saver";
import { FC, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ExportPNGModal } from "../components/modals/export/ExportPNGModal";
import { OpenLocalFileModal } from "../components/modals/open/LocalFileModal";
import { useFile, useFileActions } from "./context/dataContexts";
import { getFilename } from "./file/utils";
import { useModal } from "./modals";
import { useNotifications } from "./notifications";
import { getGraphSnapshot } from "../utils/sigma";
import { useSigmaAtom } from "./context/dataContexts";
import { useAppearance } from "./context/dataContexts";

const SAMPLES = ["Les Miserables.json", "Java.gexf", "Power Grid.gexf"];

/**
 * Convert blob to data URL (base64 encoded)
 */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Project metadata returned from dataviz-tool-header API
 */
interface ProjectMeta {
  id: string;
  name: string;
  app_name: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  storage_path?: string;
  thumbnail_path?: string | null;
  description?: string;
  isPublic?: boolean;
}

export const ToolHeaderConfig: FC = () => {
    const { openModal } = useModal();
    const { open, exportAsGexf, exportAsGephiLite, openFromData, setCurrentFile } = useFileActions();
    const { current: currentFile } = useFile();
    const { notify } = useNotifications();
    const { t } = useTranslation();
    const sigma = useSigmaAtom();
    const { backgroundColor } = useAppearance();

    // For storing loaded project metadata from onProjectSave callback
    const currentLoadedProjectId = useRef<string | null>(null);
    const currentLoadedProjectName = useRef<string | null>(null);

    useEffect(() => {
        customElements.whenDefined('dataviz-tool-header').then(() => {
            const header = document.querySelector('dataviz-tool-header');
            if (header) {
                // @ts-expect-error - setConfig method not in type definitions
                header.setConfig({
                    logo: {
                        type: 'text',
                        text: 'Gephi Lite',
                        textClass: 'font-bold text-lg text-white'
                    },
                    buttons: [
                        {
                            label: t("header.open_data_file"),
                            action: () => openModal({ component: OpenLocalFileModal, arguments: {} }),
                            align: 'left'
                        },
                        {
                            label: t("header.open_sample"),
                            type: 'dropdown',
                            align: 'left',
                            items: SAMPLES.map(sample => ({
                                label: sample,
                                action: async () => {
                                    try {
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
                                }
                            }))
                        },
                        {
                            label: t("header.open_project"),
                            action: () => {
                                // @ts-expect-error - showLoadModal method not in type definitions
                                header.showLoadModal();
                            },
                            align: 'right'
                        },
                        {
                            label: t("header.save_project"),
                            action: async () => {
                                try {
                                    // Generate graph snapshot for thumbnail
                                    const thumbnail = await getGraphSnapshot(
                                        sigma.getGraph(),
                                        sigma.getSettings(),
                                        {
                                            width: 800,
                                            height: 600,
                                            backgroundColor,
                                            cameraState: sigma.getCamera().getState(),
                                            ratio: 1,
                                        }
                                    );

                                    let projectData: object = {};
                                    await exportAsGephiLite(async (content) => {
                                        projectData = JSON.parse(content);
                                    });

                                    let thumbnailDataUri: string | null = null;
                                    if (thumbnail) {
                                        thumbnailDataUri = await blobToDataUrl(thumbnail);
                                    }

                                    // @ts-expect-error - showSaveModal method not in type definitions
                                    header.showSaveModal({
                                        name: currentFile?.filename || "Gephi Lite Project",
                                        data: projectData,
                                        thumbnailDataUri,
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
                            align: 'right'
                        },
                        {
                            label: t("header.export"),
                            type: 'dropdown',
                            align: 'right',
                            items: [
                                {
                                    label: t("header.export_png"),
                                    action: () => openModal({ component: ExportPNGModal, arguments: {} })
                                },
                                {
                                    label: t("header.export_gexf"),
                                    action: async () => {
                                        try {
                                            await exportAsGexf((content) => {
                                                FileSaver(new Blob([content]), getFilename(currentFile?.filename || "gephi-lite", "gexf"));
                                            });
                                            notify({ type: "success", message: t("graph.export.gexf.success").toString() });
                                        } catch (e) {
                                            console.error(e);
                                            notify({ type: "error", message: t("graph.export.gexf.error").toString() });
                                        }
                                    }
                                }
                            ]
                        }
                    ]
                });

                // Setup project management with new API
                // @ts-expect-error - setProjectConfig method not in type definitions
                header.setProjectConfig({
                    appName: 'gephi-lite',
                    onProjectLoad: async (projectData: object) => {
                        try {
                            // Open the project data as a graph
                            const projectName = currentLoadedProjectName.current || "Loaded Project";
                            const projectId = currentLoadedProjectId.current || "";
                            await openFromData(projectData, projectName, projectId);
                            notify({
                                type: "success",
                                message: t("graph.open.success", { filename: projectName }).toString(),
                            });
                        } catch (e) {
                            console.error(e);
                            notify({
                                type: "error",
                                message: t("graph.open.error").toString(),
                            });
                        }
                    },
                    onProjectSave: (meta: ProjectMeta) => {
                        // Update the current file with the saved project metadata
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
                            message: t("graph.save.success", { filename: meta.name }).toString(),
                        });
                    },
                });
            }
        });
    }, [openModal, open, notify, t, currentFile, exportAsGexf, exportAsGephiLite, openFromData, setCurrentFile, sigma, backgroundColor]);

    return null;
};
