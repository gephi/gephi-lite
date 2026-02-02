import i18next from "i18next";

import { type ErrorCode, Errors } from "./codes";

export * from "./codes";

export class GephiLiteError<T extends ErrorCode> extends Error {
  code: T;
  params: Parameters<(typeof Errors)[T]>[0];

  /**
   * Gephi Lite Error constructor.
   *
   * @param code  The code of the error
   * @param params Additional parameters that will be passed to the I18N function
   */
  constructor(code: T, params: Parameters<(typeof Errors)[T]>[0]) {
    const formatMessage: (typeof Errors)[T] = Errors[code];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    super(formatMessage(params as unknown as any));
    this.name = "GephiLiteError";
    this.code = code;
    this.params = params;
    this.stack = new Error().stack;
  }
}

/**
 * Given an error, it produces one string.
 * Usefull with notification
 */
export function errorToString(error: unknown): string {
  let message = "An unknown error occured";
  if (error instanceof GephiLiteError) {
    // Note:  the "as ErrorCode" is for the i18n-checker to discover the i18n keys
    message = i18next.t(`error.${error.code as ErrorCode}`, error.params as { [key: string]: unknown });
  } else if (error instanceof Error && error.message) {
    message = error.message;
  }
  return message;
}

/**
 * Given an error, it gives its error code.
 */
export function errorToCode(error: unknown): ErrorCode | undefined {
  let code: ErrorCode | undefined = undefined;
  if (error instanceof GephiLiteError) {
    code = error.code;
  }
  return code;
}
