import Editor, { Monaco } from "@monaco-editor/react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { CodeEditorIcon, RunIcon, SaveIcon } from "../../../components/common-icons";
import { Modal } from "../../../components/modals";
import { usePreferences } from "../../../core/context/dataContexts";
import { ModalProps } from "../../../core/modals/types";
import { getAppliedTheme } from "../../../core/preferences/utils";

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
interface FunctionEditorModalProps<T = Function> {
  title: string;
  withSaveAndRun?: boolean;
  functionJsDoc: string;
  defaultFunction: T;
  value?: T;
  checkFunction: (fn: T) => void; // throw error for unvalid
}

export function FunctionEditorModal<T>(props: ModalProps<FunctionEditorModalProps<T>, { run: boolean; script: T }>) {
  const { t } = useTranslation();
  const { cancel, submit } = props;
  const { theme } = usePreferences();
  const { title, withSaveAndRun, checkFunction, functionJsDoc, defaultFunction, value } = props.arguments;

  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string>(
    `${functionJsDoc}\n${value?.toString() || defaultFunction?.toString() || ""}`,
  );

  const save = useCallback(
    (run: boolean, code: string) => {
      try {
        if (code.trim().length === 0) throw new Error("Code is required");
        const script = new Function(`return ( ${code} )`)() as T;
        checkFunction(script);
        submit({ run, script });
      } catch (e) {
        setError(`${e}`);
      }
    },
    [checkFunction, submit],
  );
  return (
    <Modal
      className="modal-xl"
      title={
        <>
          <CodeEditorIcon className="me-1" />
          {title}
        </>
      }
      onClose={() => cancel()}
      onSubmit={() => save(true, code)}
    >
      <>
        {error && <p className="text-danger text-center">{error}</p>}
        <Editor
          height="40vh"
          theme={getAppliedTheme(theme) === "light" ? "light" : "vs-dark"}
          defaultLanguage="javascript"
          value={code || ""}
          onChange={(e) => {
            setError(null);
            setCode(e || "");
          }}
          onMount={(editor, monaco: Monaco) => {
            // Making read only the header & footer of the function
            editor.onKeyDown((e: KeyboardEvent) => {
              if (!["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(e.code)) {
                const fnHeaderRange = new monaco.Range(0, 0, functionJsDoc.split("\n").length + 2, 0);
                const nbLines = editor.getValue().split("\n").length;
                const fnFooterRange = new monaco.Range(nbLines, 0, nbLines + 1, 0);
                const contains = (editor.getSelections() ?? []).findIndex(
                  (range: Monaco["Range"]) =>
                    fnHeaderRange.intersectRanges(range) || fnFooterRange.intersectRanges(range),
                );
                if (contains !== -1) {
                  e.stopPropagation();
                  e.preventDefault(); // for Ctrl+C, Ctrl+V
                }
              }
            });
          }}
          options={{
            tabSize: 2,
            minimap: {
              enabled: false,
            },
          }}
        />
      </>
      <>
        <button
          type="button"
          title={t("common.cancel").toString()}
          className="btn btn-outline-dark"
          onClick={() => cancel()}
        >
          {t("common.cancel")}
        </button>
        <button
          type="button"
          title={t("common.save").toString()}
          className="btn btn-primary"
          onClick={() => save(false, code)}
        >
          <SaveIcon className="me-1" />
          {t("common.save")}
        </button>
        {withSaveAndRun && (
          <button type="submit" title={t("common.save-and-run").toString()} className="btn btn-primary">
            <RunIcon className="me-1" />
            {t("common.save-and-run")}
          </button>
        )}
      </>
    </Modal>
  );
}
