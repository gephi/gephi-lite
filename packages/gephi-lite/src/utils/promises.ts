export function wait(delay: number) {
  return new Promise(function (resolve) {
    setTimeout(resolve, delay);
  });
}

export type AsyncStatus =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "success"; message?: string }
  | { type: "error"; message?: string };
