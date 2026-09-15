import Editor from "@monaco-editor/react";
import { FC, useState } from "react";
import { Trans, useTranslation } from "react-i18next";

import { usePreferences } from "../../../core/context/dataContexts";
import { ModalProps } from "../../../core/modals/types";
import { getAppliedTheme } from "../../../core/preferences/utils";
import { Modal } from "../../modals";

export const MapStyleEditorModal: FC<ModalProps<{ initialStyle: string }, { style: Record<string, unknown> }>> = ({
  arguments: { initialStyle },
  cancel,
  submit,
}) => {
  const { t } = useTranslation();
  const { theme } = usePreferences();
  const [value, setValue] = useState(initialStyle);
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    try {
      const parsed = JSON.parse(value);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        setError("Style must be a JSON object");
        return;
      }
      submit({ style: parsed as Record<string, unknown> });
    } catch (e) {
      setError(`${e}`);
    }
  };

  return (
    <Modal
      className="modal-xl"
      bodyClassName="p-0"
      title={t("appearance.background.map.maplibre.style_editor_title")}
      onClose={() => cancel()}
      onSubmit={save}
    >
      <>
        {error && (
          <div className="alert gl-m-0 gl-alert-error d-flex flex-column align-items-center mb-3">
            <p className="mb-0">{error}</p>
          </div>
        )}

        <p className="gl-mx-3 my-3">
          <Trans
            i18nKey={"appearance.background.map.maplibre.style_description"}
            components={{
              maplibreLink: <a href="https://maplibre.org/" target="_blank" rel="noreferrer" />,
              maplibreStyleLink: (
                <a href="https://maplibre.org/maplibre-style-spec/" target="_blank" rel="noreferrer" />
              ),
              gephiLiteDocLink: (
                <a href="https://docs.gephi.org/lite/user-manual/map" target="_blank" rel="noreferrer" />
              ),
            }}
          />
        </p>
        <Editor
          height="60vh"
          theme={getAppliedTheme(theme) === "light" ? "light" : "vs-dark"}
          language="json"
          value={value}
          onChange={(v) => {
            setError(null);
            setValue(v || "");
          }}
          options={{ tabSize: 2, minimap: { enabled: false } }}
        />
      </>

      <div className="gl-gap-2 d-flex">
        <button type="button" title={t("common.cancel")} className="gl-btn gl-btn-outline" onClick={() => cancel()}>
          {t("common.cancel")}
        </button>
        <button type="submit" title={t("common.save")} className="gl-btn gl-btn-fill">
          {t("common.save")}
        </button>
      </div>
    </Modal>
  );
};
