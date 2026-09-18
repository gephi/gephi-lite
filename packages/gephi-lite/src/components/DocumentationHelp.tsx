import { useTranslation } from "react-i18next";
import { HelpIcon } from "./common-icons";

export function DocumentationHelp() {
  const { t } = useTranslation();
  return (
    <>
      {t("graph.open.local.dragndrop_text")}
      <a
        href="https://docs.gephi.org/lite/user-manual/file-formats/"
        target="_blank"
        rel="noreferrer"
      >
        <HelpIcon/>
      </a>
    </>
  )
}
