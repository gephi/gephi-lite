/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import Editor, { Monaco } from "@monaco-editor/react";
import { useCallback, useState } from "react";
import Highlight from "react-highlight";
import { useTranslation } from "react-i18next";

import { usePreferences } from "../../core/context/dataContexts";
import { useModal } from "../../core/modals";
import { ModalProps } from "../../core/modals/types";
import { getAppliedTheme } from "../../core/preferences/utils";
import { codeToFunction } from "../../utils/functions";
import { CodeEditorIcon } from "../common-icons";
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
          defaultLanguage="javascript"
          value={`${functionJsDoc}\n${code}`}
          onChange={(e) => {
            setError(null);
            setCode(codeToFunction(e || "").toString());
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
    <Modal className="modal-xl" bodyClassName="p-0" title={title} onClose={() => cancel()} onSubmit={() => save(true)}>
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
