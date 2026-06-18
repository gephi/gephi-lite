export type CallableFunction = (...args: never[]) => unknown;

/**
 * Converts a user-authored JavaScript function snippet into an executable function.
 * Callers must validate the returned function before using it against graph data.
 */
export function codeToFunction<T extends CallableFunction>(code: string): T {
  const fn = new Function(`return (${code})`)() as unknown;

  if (typeof fn !== "function") {
    throw new Error("Code must define a function");
  }

  return fn as T;
}

export function stripFunctionJsDoc(editorValue: string, functionJsDoc: string): string {
  if (!functionJsDoc) return editorValue;

  const jsDocLines = functionJsDoc.split("\n");
  const editorLines = editorValue.split("\n");
  const hasExpectedHeader = jsDocLines.every((line, index) => editorLines[index] === line);

  if (!hasExpectedHeader) return editorValue;

  return editorLines.slice(jsDocLines.length).join("\n");
}
