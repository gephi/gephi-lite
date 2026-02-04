/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { getGraphTypeScriptDefinition } from "@gephi/gephi-lite-sdk";
import Editor, { Monaco } from "@monaco-editor/react";
import { useCallback, useMemo, useState } from "react";
import Highlight from "react-highlight";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import graphologyDts from "../../assets/graphology-types.txt?raw";
import { useGraphDataset, usePreferences } from "../../core/context/dataContexts";
import { useModal } from "../../core/modals";
import { ModalProps } from "../../core/modals/types";
import { getAppliedTheme } from "../../core/preferences/utils";
import { codeToFunction } from "../../utils/functions";
import { CodeEditorIcon, HelpIcon } from "../common-icons";
import { Modal } from "../modals";

export interface FunctionEditorProps<T extends Function> {
  editorName?: string;
  fullEditor?: boolean;
  functionJsDoc: string;
  initialFunctionCode: string;
  checkFunction: (fn: T) => void; // throw error for unvalid
  onSubmit?: (fn: T) => void;
  saveAndRunI18nKey?: string;
}

export function useFunctionEditor<T extends Function>({
  editorName,
  fullEditor,
  checkFunction,
  functionJsDoc,
  initialFunctionCode,
  onSubmit,
  saveAndRunI18nKey,
}: FunctionEditorProps<T>) {
  const { theme } = usePreferences();
  const { t } = useTranslation();
  const { openModal } = useModal();
  const graphDataset = useGraphDataset();

  // TS types for graphology and graph items
  const graphTypes = useMemo(() => getGraphTypeScriptDefinition(graphDataset), [graphDataset]);
  const graphologyTypes = useMemo(() => {
    const regexExport = new RegExp("export \\{(.*)\\};", "gs");
    const regexDefaultExport = new RegExp("export default .*;", "gs");
    return (
      graphologyDts
        // Remove export
        .replace(regexExport, "")
        // Remove default export
        .replace(regexDefaultExport, "")
    );
  }, []);

  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string>(initialFunctionCode);

  const getFunction = useCallback(() => {
    try {
      if (!code.trim().length) throw new Error("Code is required");
      const fn = codeToFunction<T>(code);
      checkFunction(fn);
      return fn;
    } catch (e) {
      setError(`${e}`);
      return null;
    }
  }, [checkFunction, code]);

  if (!fullEditor)
    return {
      error,
      getFunction,
      content: (
        <>
          <div className="position-relative">
            <>
              <>
                <div className="code-thumb mt-1">
                  <Highlight className="javascript">{`${functionJsDoc}\n${code}`}</Highlight>
                </div>
                <div className="filler-fade-out position-absolute bottom-0"></div>
              </>
              <div className="position-absolute top-0 w-100 h-100 d-flex justify-content-center align-items-center">
                <button
                  type="button"
                  className="gl-btn gl-btn-outline gl-container-highest-bg mx-auto d-block m-3"
                  onClick={() => {
                    const fn = getFunction();
                    if (fn)
                      openModal({
                        component: FunctionEditorModal<T>,
                        arguments: {
                          title: t("edition.code_editor"),
                          editorName,
                          functionJsDoc,
                          checkFunction,
                          initialFunctionCode: code,
                          withSaveAndRun: !!onSubmit,
                          saveAndRunI18nKey,
                        },
                        beforeSubmit: ({ fn, run }) => {
                          setCode(fn.toString());
                          if (run && onSubmit) onSubmit(fn);
                        },
                      });
                    else console.error("Cannot open code editor, because of error", error);
                  }}
                  title={t("common.open_code_editor")}
                >
                  <CodeEditorIcon className="me-1" />
                  {t("common.open_code_editor")}
                </button>
              </div>
            </>
          </div>
        </>
      ),
    };

  return {
    error,
    getFunction,
    content: (
      <>
        {error && <p className="text-danger text-center">{error}</p>}
        <Editor
          height="40vh"
          theme={getAppliedTheme(theme) === "light" ? "light" : "vs-dark"}
          language="javascript"
          value={`${functionJsDoc}\n${code}`}
          onChange={(e) => {
            setError(null);
            setCode(codeToFunction(e || "").toString());
          }}
          onMount={(editor, monaco: Monaco) => {
            const lines = editor.getValue().split("\n");
            const nbLines = lines.length;
            const headerLines = [0, functionJsDoc.split("\n").length + 2];
            const footerLines = [nbLines, nbLines + 1];

            // Making read only the header & footer of the function
            editor.onKeyDown((e: KeyboardEvent) => {
              const headerRange = new monaco.Range(headerLines[0], 0, headerLines[1], 0);
              const footerRange = new monaco.Range(footerLines[0], 0, footerLines[1], 0);
              if (!["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(e.code)) {
                const contains = (editor.getSelections() ?? []).findIndex(
                  (range: Monaco["Range"]) => headerRange.intersectRanges(range) || footerRange.intersectRanges(range),
                );
                if (contains !== -1) {
                  e.stopPropagation();
                  e.preventDefault(); // for Ctrl+C, Ctrl+V
                }
              }
            });

            // Adding graph types
            monaco.languages.typescript.javascriptDefaults.setExtraLibs([
              { content: graphTypes },
              { content: graphologyTypes },
            ]);

            // Select text of the function body (ie. the documentation)
            editor.setSelection(
              new monaco.Range(headerLines[1], 0, footerLines[0] - 1, lines[footerLines[0] - 2].length + 1),
            );
            editor.focus();
          }}
          options={{
            tabSize: 2,
            minimap: {
              enabled: false,
            },
          }}
        />
      </>
    ),
  };
}

export function FunctionEditorModal<T extends Function>(
  props: ModalProps<
    Omit<FunctionEditorProps<T>, "fullEditor"> & {
      title: string;
      withSaveAndRun?: boolean;
    },
    { run: boolean; fn: T }
  >,
) {
  const { t } = useTranslation();
  const { submit, cancel } = props;
  const { title, withSaveAndRun, saveAndRunI18nKey = "common.save-and-run" } = props.arguments;
  const { content, getFunction } = useFunctionEditor({ ...props.arguments, fullEditor: true });

  const save = useCallback(
    (run: boolean) => {
      const fn = getFunction();
      if (fn) {
        submit({ run, fn });
      }
    },
    [getFunction, submit],
  );

  return (
    <Modal
      className="modal-xl"
      bodyClassName="p-0"
      title={
        <>
          {title}
          <Link
            className="ms-1 d-flex align-items-center"
            to="https://docs.gephi.org/lite/user-manual/custom-scripts"
            title={t("common.help")}
            target="_blank"
          >
            <HelpIcon />
          </Link>
        </>
      }
      onClose={() => cancel()}
      onSubmit={() => save(true)}
    >
      {content}
      <div className="gl-gap-2 d-flex">
        <button type="button" title={t("common.cancel")} className="gl-btn gl-btn-outline" onClick={() => cancel()}>
          {t("common.cancel")}
        </button>

        <button type="button" title={t("common.save")} className="gl-btn gl-btn-fill" onClick={() => save(false)}>
          {t("common.save")}
        </button>

        {withSaveAndRun && (
          <button type="submit" title={t(saveAndRunI18nKey)} className="gl-btn gl-btn-fill">
            {t(saveAndRunI18nKey)}
          </button>
        )}
      </div>
    </Modal>
  );
}
