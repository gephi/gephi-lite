export const Errors = {
  IMPORT_BAD_VERSION: (args: { version: string }) =>
    `Your file is from an older version of gephi-lite (${args.version}) which is not compatible with the actual version`,
  IMPORT_BAD_FILE_FORMAT: (args: { fileName: string }) => `Format of file ${args.fileName} is not recognized`,
};

export type ErrorCode = keyof typeof Errors;
