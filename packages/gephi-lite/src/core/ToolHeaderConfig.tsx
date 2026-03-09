import FileSaver from "file-saver";
import { FC, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ExportPNGModal } from "../components/modals/export/ExportPNGModal";
import { SaveAsModal } from "../components/modals/save/SaveAsModal";
import { OpenLocalFileModal } from "../components/modals/open/LocalFileModal";
import { OpenModal } from "../components/modals/open/OpenModal";
import { useFile, useFileActions } from "./context/dataContexts";
import { getFilename } from "./file/utils";
import { useModal } from "./modals";
import { useNotifications } from "./notifications";

const SAMPLES = ["Les Miserables.json", "Java.gexf", "Power Grid.gexf"];

export const ToolHeaderConfig: FC = () => {
    const { openModal } = useModal();
    const { open, exportAsGexf } = useFileActions();
    const { current: currentFile } = useFile();
    const { notify } = useNotifications();
    const { t } = useTranslation();

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
                            action: () => openModal({ component: OpenModal, arguments: {} }),
                            align: 'right'
                        },
                        {
                            label: t("header.save_project"),
                            action: () => openModal({ component: SaveAsModal, arguments: {} }),
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
            }
        });
    }, [openModal, open, notify, t, currentFile, exportAsGexf]);

    return null;
};
