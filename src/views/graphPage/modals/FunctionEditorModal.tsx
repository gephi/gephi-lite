import { useState } from "react";
import { useTranslation } from "react-i18next";
import Editor from "@monaco-editor/react";

import { ModalProps } from "../../../core/modals/types";
import { Modal } from "../../../components/modals";
import { CodeEditorIcon } from "../../../components/common-icons";

interface FunctionEditorModalProps<T = Function> {
  title: string;
  functionJsDoc: string;
  defaultFunction: T;
  value?: T;
  checkFunction: (fn: T) => void; // throw error for unvalid
}

export function FunctionEditorModal<T>(props: ModalProps<FunctionEditorModalProps<T>, T>) {
  const { t } = useTranslation();
  const { cancel, submit } = props;
  const { title, checkFunction, functionJsDoc, defaultFunction, value } = props.arguments;

  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string>(
    `${functionJsDoc}\n${value?.toString() || defaultFunction?.toString() || ""}`,
  );

  /**
   * Transform code as string into a callable function
   */
  function codeToFunction(code: string): T {
    if (code.trim().length === 0) throw new Error("Code is required");
    // eslint-disable-next-line no-new-func
    return new Function(`return ( ${code} )`)() as T;
  }

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
    >
      <>
        {error && <p className="text-danger text-center">{error}</p>}
        <Editor
          height="40vh"
          defaultLanguage="javascript"
          value={code || ""}
          onChange={(e) => {
            setError(null);
            setCode(e || "");
          }}
          onMount={(editor, monaco) => {
            // Making read only the header & footer of the function
            editor.onKeyDown((e) => {
              if (!["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(e.code)) {
                const fnHeaderRange = new monaco.Range(0, 0, functionJsDoc.split("\n").length + 2, 0);
                const nbLines = code.split("\n").length;
                const fnFooterRange = new monaco.Range(nbLines, 0, nbLines + 1, 0);
                const contains = (editor.getSelections() ?? []).findIndex(
                  (range) => fnHeaderRange.intersectRanges(range) || fnFooterRange.intersectRanges(range),
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
          className="btn btn-secondary"
          onClick={() => cancel()}
        >
          {t("common.cancel")}
        </button>
        <button
          type="button"
          title={t("common.save").toString()}
          className="btn btn-primary"
          onClick={() => {
            try {
              const fn = codeToFunction(code);
              checkFunction(fn);
              submit(fn);
            } catch (e) {
              setError(`${e}`);
            }
          }}
        >
          {t("common.save")}
        </button>
      </>
    </Modal>
  );
}
