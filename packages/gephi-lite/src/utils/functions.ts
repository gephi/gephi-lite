// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export function codeToFunction<T extends Function>(code: string): T {
  return new Function(`return (${code})`)() as T;
}
