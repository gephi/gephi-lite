import { FC, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useModal } from "./modals";
import { useFileActions } from "./context/dataContexts";
import { useNotifications } from "./notifications";
import { OpenModal } from "../components/modals/open/OpenModal";
import { SaveAsModal } from "../components/modals/save/SaveAsModal";

const SAMPLES = ["Les Miserables.json", "Java.gexf", "Power Grid.gexf"];

export const ToolHeaderConfig: FC = () => {
    const { openModal } = useModal();
    const { open } = useFileActions();
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
                            label: 'データファイルの読込',
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
                            label: 'プロジェクトの読込',
                            action: () => openModal({ component: OpenModal, arguments: {} }),
                            align: 'right'
                        },
                        {
                            label: 'プロジェクトの保存',
                            action: () => openModal({ component: SaveAsModal, arguments: {} }),
                            align: 'right'
                        }
                    ]
                });
            }
        });
    }, [openModal, open, notify, t]);

    return null;
};
